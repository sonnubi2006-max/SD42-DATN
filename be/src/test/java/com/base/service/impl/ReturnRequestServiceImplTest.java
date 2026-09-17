package com.base.service.impl;

import com.base.dto.response.returnRequest.ReturnResponse;
import com.base.dto.response.returnRequest.ReturnStatisticsResponse;
import com.base.dto.request.returnRequest.CreateExchangeItemRequest;
import com.base.dto.request.returnRequest.CreateReturnItemRequest;
import com.base.dto.request.returnRequest.CreateReturnRequest;
import com.base.dto.request.returnRequest.RefundPreviewRequest;
import com.base.dto.response.returnRequest.RefundPreviewResponse;
import com.base.entity.Order;
import com.base.entity.OrderDetail;
import com.base.entity.Product;
import com.base.entity.ProductVariant;
import com.base.entity.ReturnItem;
import com.base.entity.ReturnRequest;
import com.base.entity.User;
import com.base.enums.OrderStatus;
import com.base.enums.OrderType;
import com.base.enums.ReturnStatus;
import com.base.enums.ReturnType;
import com.base.exception.BadRequestException;
import com.base.repository.CouponRepository;
import com.base.repository.OrderRepository;
import com.base.repository.OrderTransactionLogRepository;
import com.base.repository.ExchangeDeliveryRepository;
import com.base.repository.ProductVariantRepository;
import com.base.repository.PromotionRepository;
import com.base.repository.ReturnRequestRepository;
import com.base.repository.UserRepository;
import com.base.service.helper.ReturnPolicy;
import com.base.utils.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReturnRequestServiceImplTest {

    @Mock private ReturnRequestRepository returnRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private UserRepository userRepository;
    @Mock private SecurityUtils securityUtils;
    @Mock private CouponRepository couponRepository;
    @Mock private PromotionRepository promotionRepository;
    @Mock private OrderTransactionLogRepository orderTransactionLogRepository;
    @Mock private ReturnPolicy returnPolicy;
    @Mock private ExchangeDeliveryRepository exchangeDeliveryRepository;

    @InjectMocks private ReturnRequestServiceImpl returnService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void complete_shouldNotTreatPendingQuantityAsCompletedReturn() {
        Fixture fixture = fixture(2, 1);
        stubComplete(fixture, 0);

        ReturnResponse response = returnService.complete(100L, null);

        assertEquals(ReturnStatus.COMPLETED, response.getStatus());
        assertEquals(OrderStatus.COMPLETED, fixture.order.getOrderStatus());
        assertEquals(9, fixture.variant.getStockQuantity());
        assertEquals(0, response.getItems().get(0).getDamagedQuantity());
    }

    @Test
    void complete_shouldMarkOrderRefundedWhenCompletedAndCurrentCoverWholeOrder() {
        Fixture fixture = fixture(2, 1);
        stubComplete(fixture, 1);

        returnService.complete(100L, null);

        assertEquals(OrderStatus.REFUNDED, fixture.order.getOrderStatus());
    }

    @Test
    void complete_shouldBeIdempotentAfterFirstCompletion() {
        Fixture fixture = fixture(1, 1);
        stubComplete(fixture, 0);

        returnService.complete(100L, null);

        assertThrows(BadRequestException.class, () -> returnService.complete(100L, null));
        assertEquals(9, fixture.variant.getStockQuantity());
    }

    @Test
    void create_shouldRejectReturnTypeWithoutImplementedWorkflow() {
        Order order = new Order();
        order.setOrderId(10L);
        order.setOrderStatus(OrderStatus.COMPLETED);
        order.setOrderDetails(new ArrayList<>());

        CreateReturnItemRequest item = new CreateReturnItemRequest();
        item.setVariantId(20L);
        item.setQuantity(1);

        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(10L);
        request.setReturnType(ReturnType.DAMAGED);
        request.setItems(java.util.List.of(item));

        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken("staff", null, "ROLE_STAFF"));
        when(securityUtils.getCurrentUserId()).thenReturn(99L);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        when(orderRepository.findByIdWithDetailsForUpdate(10L)).thenReturn(Optional.of(order));

        assertThrows(BadRequestException.class, () -> returnService.create(request));
    }

    @Test
    void complete_shouldExposeProcessingStaff() {
        Fixture fixture = fixture(2, 1);
        stubComplete(fixture, 0);

        User staff = new User();
        staff.setUserId(99L);
        staff.setUsername("staff99");
        staff.setFullName("Nguyễn Văn Xử Lý");

        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken("staff", null, "ROLE_STAFF"));
        when(securityUtils.getCurrentUserId()).thenReturn(99L);
        when(userRepository.findById(99L)).thenReturn(Optional.of(staff));

        ReturnResponse response = returnService.complete(100L, null);

        assertEquals(99L, response.getProcessedById());
        assertEquals("Nguyễn Văn Xử Lý", response.getProcessedByName());
    }

    @Test
    void create_shouldUseStoredOrderSubtotalWhenCurrentProductPriceChanged() {
        PurchasePriceFixture fixture = purchasePriceFixture();
        authenticateStaff();
        when(orderRepository.findByIdWithDetailsForUpdate(10L))
                .thenReturn(Optional.of(fixture.order));

        CreateReturnItemRequest item = new CreateReturnItemRequest();
        item.setVariantId(20L);
        item.setQuantity(1);
        item.setOriginalPrice(new BigDecimal("600000"));
        item.setRefundPrice(new BigDecimal("600000"));

        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(10L);
        request.setReturnType(ReturnType.REFUND);
        request.setItems(List.of(item));

        BadRequestException exception = assertThrows(
                BadRequestException.class, () -> returnService.create(request));
        assertEquals("Hệ thống hiện chỉ hỗ trợ đổi sản phẩm lỗi, không hỗ trợ đổi hàng hoàn tiền",
                exception.getMessage());
    }

    @Test
    void create_shouldAllowReturnWhenCouponCoversAllMerchandise() {
        PurchasePriceFixture fixture = purchasePriceFixture();
        fixture.order.setDiscountAmount(new BigDecimal("840000"));
        fixture.order.setShippingFee(new BigDecimal("30000"));
        fixture.order.setFinalAmount(new BigDecimal("30000"));
        authenticateStaff();
        when(orderRepository.findByIdWithDetailsForUpdate(10L))
                .thenReturn(Optional.of(fixture.order));

        CreateReturnItemRequest item = new CreateReturnItemRequest();
        item.setVariantId(20L);
        item.setQuantity(1);

        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(10L);
        request.setReturnType(ReturnType.REFUND);
        request.setItems(List.of(item));

        BadRequestException exception = assertThrows(
                BadRequestException.class, () -> returnService.create(request));
        assertEquals("Hệ thống hiện chỉ hỗ trợ đổi sản phẩm lỗi, không hỗ trợ đổi hàng hoàn tiền",
                exception.getMessage());
    }

    @Test
    void create_shouldAllowSameVariantExchangeWhenCurrentPriceChanged() {
        PurchasePriceFixture fixture = purchasePriceFixture();
        authenticateStaff();
        when(orderRepository.findByIdWithDetailsForUpdate(10L))
                .thenReturn(Optional.of(fixture.order));
        when(variantRepository.findById(20L))
                .thenReturn(Optional.of(fixture.variant));
        when(returnRepository.sumActiveReturnedQuantity(10L, 20L))
                .thenReturn(0);
        when(returnRepository.save(any(ReturnRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreateReturnItemRequest returnItem = new CreateReturnItemRequest();
        returnItem.setVariantId(20L);
        returnItem.setQuantity(1);

        CreateExchangeItemRequest exchangeItem = new CreateExchangeItemRequest();
        exchangeItem.setSourceVariantId(20L);
        exchangeItem.setNewVariantId(20L);
        exchangeItem.setNewQuantity(1);

        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(10L);
        request.setReturnType(ReturnType.EXCHANGE);
        request.setItems(List.of(returnItem));
        request.setExchangeItems(List.of(exchangeItem));

        ReturnResponse response = returnService.create(request);

        assertEquals(ReturnType.EXCHANGE, response.getReturnType());
        assertEquals(20L, response.getExchangeItems().get(0).getVariantId());
        assertEquals(1, response.getExchangeItems().get(0).getQuantity());
        assertEquals(new BigDecimal("280000"), response.getRefundAmount());
    }

    @Test
    void create_shouldAllowMultipleExchangeVariantsWithDifferentQuantities() {
        PurchasePriceFixture fixture = purchasePriceFixture();
        authenticateStaff();

        ProductVariant blackLarge = new ProductVariant();
        blackLarge.setVariantId(21L);
        blackLarge.setProduct(fixture.variant.getProduct());
        blackLarge.setColor("Đen");
        blackLarge.setSize("L");
        blackLarge.setPrice(new BigDecimal("400000"));
        blackLarge.setStockQuantity(10);

        ProductVariant whiteLarge = new ProductVariant();
        whiteLarge.setVariantId(22L);
        whiteLarge.setProduct(fixture.variant.getProduct());
        whiteLarge.setColor("Trắng");
        whiteLarge.setSize("L");
        whiteLarge.setPrice(new BigDecimal("400000"));
        whiteLarge.setStockQuantity(10);

        when(orderRepository.findByIdWithDetailsForUpdate(10L))
                .thenReturn(Optional.of(fixture.order));
        when(variantRepository.findById(20L)).thenReturn(Optional.of(fixture.variant));
        when(variantRepository.findById(21L)).thenReturn(Optional.of(blackLarge));
        when(variantRepository.findById(22L)).thenReturn(Optional.of(whiteLarge));
        when(returnRepository.sumActiveReturnedQuantity(10L, 20L)).thenReturn(0);
        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        when(returnRepository.save(any(ReturnRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreateReturnItemRequest returnItem = new CreateReturnItemRequest();
        returnItem.setVariantId(20L);
        returnItem.setQuantity(3);

        CreateExchangeItemRequest firstExchange = new CreateExchangeItemRequest();
        firstExchange.setSourceVariantId(20L);
        firstExchange.setNewVariantId(21L);
        firstExchange.setNewQuantity(1);

        CreateExchangeItemRequest secondExchange = new CreateExchangeItemRequest();
        secondExchange.setSourceVariantId(20L);
        secondExchange.setNewVariantId(22L);
        secondExchange.setNewQuantity(2);

        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(10L);
        request.setReturnType(ReturnType.EXCHANGE);
        request.setItems(List.of(returnItem));
        request.setExchangeItems(List.of(firstExchange, secondExchange));

        ReturnResponse response = returnService.create(request);

        assertEquals(2, response.getExchangeItems().size());
        assertEquals(1, response.getExchangeItems().get(0).getQuantity());
        assertEquals(2, response.getExchangeItems().get(1).getQuantity());
        assertEquals(new BigDecimal("840000"), response.getRefundAmount());
    }

    @Test
    void create_shouldRejectWhenTotalExchangeQuantityExceedsSelectedReturnQuantity() {
        PurchasePriceFixture fixture = purchasePriceFixture();
        authenticateStaff();
        when(orderRepository.findByIdWithDetailsForUpdate(10L))
                .thenReturn(Optional.of(fixture.order));
        when(variantRepository.findById(20L)).thenReturn(Optional.of(fixture.variant));
        when(returnRepository.sumActiveReturnedQuantity(10L, 20L)).thenReturn(0);

        CreateReturnItemRequest returnItem = new CreateReturnItemRequest();
        returnItem.setVariantId(20L);
        returnItem.setQuantity(2);

        CreateExchangeItemRequest exchangeItem = new CreateExchangeItemRequest();
        exchangeItem.setNewVariantId(21L);
        exchangeItem.setNewQuantity(3);

        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(10L);
        request.setReturnType(ReturnType.EXCHANGE);
        request.setItems(List.of(returnItem));
        request.setExchangeItems(List.of(exchangeItem));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> returnService.create(request)
        );

        assertEquals(
                "Tổng số lượng giao đổi (3) phải bằng tổng số lượng khách trả (2)",
                exception.getMessage()
        );
    }

    @Test
    void create_shouldSubtractOtherActiveReturnsFromPurchasedQuantity() {
        PurchasePriceFixture fixture = purchasePriceFixture();
        authenticateStaff();
        when(orderRepository.findByIdWithDetailsForUpdate(10L))
                .thenReturn(Optional.of(fixture.order));
        when(returnRepository.sumActiveReturnedQuantity(10L, 20L)).thenReturn(2);

        CreateReturnItemRequest returnItem = new CreateReturnItemRequest();
        returnItem.setVariantId(20L);
        returnItem.setQuantity(2);

        CreateReturnRequest request = new CreateReturnRequest();
        request.setOrderId(10L);
        request.setReturnType(ReturnType.EXCHANGE);
        request.setItems(List.of(returnItem));
        CreateExchangeItemRequest exchangeItem = new CreateExchangeItemRequest();
        exchangeItem.setSourceVariantId(20L);
        exchangeItem.setNewVariantId(20L);
        exchangeItem.setNewQuantity(2);
        request.setExchangeItems(List.of(exchangeItem));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> returnService.create(request)
        );

        assertEquals(
                "Số lượng trả vượt quá số lượng đã mua: Áo khuyến mãi",
                exception.getMessage()
        );
    }

    @Test
    void refundPreview_shouldUsePurchaseSnapshotInsteadOfCurrentPromotion() {
        PurchasePriceFixture fixture = purchasePriceFixture();
        fixture.order.setDiscountAmount(new BigDecimal("240000"));
        fixture.order.setFinalAmount(new BigDecimal("600000"));
        authenticateStaff();
        when(orderRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(fixture.order));
        when(returnRepository.sumActiveReturnedQuantity(10L, 20L))
                .thenReturn(0);

        RefundPreviewRequest.PreviewItem item =
                new RefundPreviewRequest.PreviewItem();
        item.setVariantId(20L);
        item.setQuantity(1);

        RefundPreviewRequest request = new RefundPreviewRequest();
        request.setOrderId(10L);
        request.setItems(List.of(item));

        RefundPreviewResponse response =
                returnService.calculateRefundPreview(request);

        assertEquals(
                new BigDecimal("280000.00"),
                response.getItems().get(0).getUnitPrice()
        );
        assertEquals(
                new BigDecimal("200000"),
                response.getItems().get(0).getRefundAmount()
        );
    }

    @Test
    void refundPreview_shouldShowZeroWhenOnlyShippingWasPaid() {
        PurchasePriceFixture fixture = purchasePriceFixture();
        fixture.order.setDiscountAmount(new BigDecimal("840000"));
        fixture.order.setShippingFee(new BigDecimal("30000"));
        fixture.order.setFinalAmount(new BigDecimal("30000"));
        authenticateStaff();
        when(orderRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(fixture.order));
        when(returnRepository.sumActiveReturnedQuantity(10L, 20L))
                .thenReturn(0);

        RefundPreviewRequest.PreviewItem item =
                new RefundPreviewRequest.PreviewItem();
        item.setVariantId(20L);
        item.setQuantity(1);

        RefundPreviewRequest request = new RefundPreviewRequest();
        request.setOrderId(10L);
        request.setItems(List.of(item));

        RefundPreviewResponse response =
                returnService.calculateRefundPreview(request);

        assertEquals(BigDecimal.ZERO, response.getPaidAmount());
        assertEquals(BigDecimal.ZERO, response.getTotalRefund());
        assertEquals(BigDecimal.ZERO, response.getItems().get(0).getRefundAmount());
        assertEquals(
                response.getItems().get(0).getLineSubtotal(),
                response.getItems().get(0).getAllocatedDiscount()
        );
    }

    @Test
    void complete_shouldProcessZeroRefundReturnNormally() {
        Fixture fixture = fixture(1, 1);
        fixture.order.setShippingFee(new BigDecimal("30000"));
        fixture.order.setFinalAmount(new BigDecimal("30000"));
        stubComplete(fixture, 0);

        ReturnResponse response = returnService.complete(100L, null);

        assertEquals(ReturnStatus.COMPLETED, response.getStatus());
        assertEquals(BigDecimal.ZERO, response.getRefundAmount());
        assertEquals(OrderStatus.REFUNDED, fixture.order.getOrderStatus());
    }

    @Test
    void complete_shouldRecalculateLegacyRefundFromPurchaseSnapshot() {
        Fixture fixture = fixture(3, 1);
        fixture.variant.setPrice(new BigDecimal("600000"));
        OrderDetail detail = fixture.order.getOrderDetails().get(0);
        detail.setPrice(new BigDecimal("400000"));
        detail.setSalePrice(null);
        detail.setSubtotal(new BigDecimal("840000"));
        fixture.order.setTotalAmount(new BigDecimal("840000"));
        fixture.order.setShippingFee(BigDecimal.ZERO);
        fixture.order.setFinalAmount(new BigDecimal("840000"));
        fixture.returnRequest.setRefundAmount(new BigDecimal("600000"));
        fixture.returnRequest.getItems().get(0)
                .setOriginalPrice(new BigDecimal("600000"));
        fixture.returnRequest.getItems().get(0)
                .setRefundPrice(new BigDecimal("600000"));
        stubComplete(fixture, 0);

        ReturnResponse response = returnService.complete(100L, null);

        assertEquals(
                new BigDecimal("280000.00"),
                response.getItems().get(0).getOriginalPrice()
        );
        assertEquals(
                new BigDecimal("280000"),
                response.getItems().get(0).getRefundPrice()
        );
        assertEquals(new BigDecimal("280000"), response.getRefundAmount());
    }

    @Test
    void statistics_shouldSubtractOnlyCompletedRefundsAndCountDistinctOrders() {
        Order onlineOrder = new Order();
        onlineOrder.setOrderId(10L);
        onlineOrder.setOrderType(OrderType.ONLINE);
        onlineOrder.setPaymentMethod(com.base.enums.PaymentMethod.BANK_TRANSFER);
        Order posOrder = new Order();
        posOrder.setOrderId(20L);
        posOrder.setOrderType(OrderType.POS);
        posOrder.setPaymentMethod(com.base.enums.PaymentMethod.CASH);

        ReturnRequest onlineRefund = ReturnRequest.builder()
                .returnId(1L)
                .order(onlineOrder)
                .status(ReturnStatus.COMPLETED)
                .returnType(ReturnType.REFUND)
                .refundAmount(new BigDecimal("100000"))
                .build();
        onlineRefund.setUpdatedAt(LocalDateTime.of(2026, 7, 30, 10, 0));

        ReturnRequest exchange = ReturnRequest.builder()
                .returnId(2L)
                .order(onlineOrder)
                .status(ReturnStatus.COMPLETED)
                .returnType(ReturnType.EXCHANGE)
                .refundAmount(new BigDecimal("300000"))
                .build();
        exchange.setUpdatedAt(LocalDateTime.of(2026, 7, 30, 11, 0));

        ReturnRequest posRefund = ReturnRequest.builder()
                .returnId(3L)
                .order(posOrder)
                .status(ReturnStatus.COMPLETED)
                .returnType(ReturnType.REFUND)
                .refundAmount(new BigDecimal("50000"))
                .build();
        posRefund.setUpdatedAt(LocalDateTime.of(2026, 7, 31, 9, 0));

        when(returnRepository.findCompletedForStatistics(any(), any()))
                .thenReturn(List.of(onlineRefund, exchange, posRefund));

        ReturnStatisticsResponse response = returnService.getStatistics(
                LocalDateTime.of(2026, 7, 30, 0, 0),
                LocalDateTime.of(2026, 7, 31, 23, 59)
        );

        assertEquals(2, response.getReturnedOrderCount());
        assertEquals(3, response.getCompletedReturnCount());
        assertEquals(new BigDecimal("150000"), response.getTotalRefundAmount());
        assertEquals(new BigDecimal("50000"), response.getPosRefundAmount());
        assertEquals(new BigDecimal("100000"), response.getOnlineRefundAmount());
        assertEquals(new BigDecimal("50000"), response.getCashRefundAmount());
        assertEquals(new BigDecimal("100000"), response.getTransferRefundAmount());
        assertEquals(2, response.getDailyRefunds().size());
        assertEquals(new BigDecimal("100000"), response.getDailyRefunds().get(0).getTransferRefundAmount());
        assertEquals(BigDecimal.ZERO, response.getDailyRefunds().get(0).getCashRefundAmount());
        assertEquals(new BigDecimal("50000"), response.getDailyRefunds().get(1).getCashRefundAmount());
    }

    private void authenticateStaff() {
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken("staff", null, "ROLE_STAFF"));
        when(securityUtils.getCurrentUserId()).thenReturn(99L);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
    }

    private PurchasePriceFixture purchasePriceFixture() {
        Product product = new Product();
        product.setProductId(30L);
        product.setProductName("Áo khuyến mãi");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setPrice(new BigDecimal("600000"));
        variant.setColor("Đen");
        variant.setSize("M");
        variant.setStockQuantity(10);

        Order order = new Order();
        order.setOrderId(10L);
        order.setOrderCode("ORD-PRICE-SNAPSHOT");
        order.setOrderStatus(OrderStatus.COMPLETED);
        order.setTotalAmount(new BigDecimal("840000"));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setShippingFee(BigDecimal.ZERO);
        order.setFinalAmount(new BigDecimal("840000"));
        order.setOrderDetails(new ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setProductName(product.getProductName());
        detail.setColor("Đen");
        detail.setSize("M");
        detail.setQuantity(3);
        detail.setPrice(new BigDecimal("400000"));
        detail.setSalePrice(null);
        detail.setSubtotal(new BigDecimal("840000"));
        order.getOrderDetails().add(detail);

        return new PurchasePriceFixture(order, variant);
    }

    private void stubComplete(Fixture fixture, int previouslyCompletedQuantity) {
        when(returnRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(fixture.returnRequest));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(fixture.variant));
        when(returnRepository.sumCompletedReturnedQuantity(10L, 20L))
                .thenReturn(previouslyCompletedQuantity);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(returnRepository.save(any(ReturnRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Fixture fixture(int orderedQuantity, int returnedQuantity) {
        Product product = new Product();
        product.setProductId(30L);
        product.setProductName("Áo");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setStockQuantity(8);

        Order order = new Order();
        order.setOrderId(10L);
        order.setOrderCode("ORD-10");
        order.setOrderStatus(OrderStatus.COMPLETED);
        order.setOrderDetails(new ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(orderedQuantity);
        detail.setPrice(BigDecimal.TEN);
        detail.setSubtotal(BigDecimal.TEN.multiply(
                BigDecimal.valueOf(orderedQuantity)));
        order.getOrderDetails().add(detail);
        order.setTotalAmount(detail.getSubtotal());
        order.setShippingFee(BigDecimal.ZERO);
        order.setFinalAmount(detail.getSubtotal());

        ReturnRequest returnRequest = ReturnRequest.builder()
                .returnId(100L)
                .order(order)
                .orderCode(order.getOrderCode())
                .customerName("Khách")
                .status(ReturnStatus.APPROVED)
                .returnType(ReturnType.REFUND)
                .refundAmount(java.math.BigDecimal.ZERO)
                .build();

        ReturnItem item = ReturnItem.builder()
                .returnItemId(200L)
                .returnRequest(returnRequest)
                .variant(variant)
                .productId(product.getProductId())
                .productName(product.getProductName())
                .quantity(returnedQuantity)
                .originalPrice(java.math.BigDecimal.TEN)
                .refundPrice(java.math.BigDecimal.TEN.multiply(
                        BigDecimal.valueOf(returnedQuantity)))
                .build();
        returnRequest.getItems().add(item);

        return new Fixture(order, variant, returnRequest);
    }

    private record Fixture(Order order, ProductVariant variant, ReturnRequest returnRequest) {
    }

    private record PurchasePriceFixture(Order order, ProductVariant variant) {
    }
}
