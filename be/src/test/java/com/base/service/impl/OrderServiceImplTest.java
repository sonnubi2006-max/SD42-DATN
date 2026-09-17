package com.base.service.impl;

import com.base.dto.event.EmailMessage;
import com.base.dto.request.order.CreateOrderRequest;
import com.base.dto.request.order.CreateOrderOnlineRequest;
import com.base.dto.request.order.GuestOrderLookupRequest;
import com.base.dto.request.order.OrderAddressRequest;
import com.base.dto.request.order.OrderDetailRequest;
import com.base.dto.request.order.PosAddItemRequest;
import com.base.dto.request.order.PosCheckoutRequest;
import com.base.dto.request.order.PosUpdateItemRequest;
import com.base.dto.request.order.UpdateOrderStatusRequest;
import com.base.entity.*;
import com.base.enums.OrderStatus;
import com.base.enums.OrderType;
import com.base.enums.PaymentMethod;
import com.base.enums.ProductStatus;
import com.base.enums.ProductVariantStatus;
import com.base.enums.RoleUser;
import com.base.exception.BadRequestException;
import com.base.exception.InsufficientStockException;
import com.base.exception.ResourceNotFoundException;
import com.base.mapper.OrderMapper;
import com.base.queue.EmailProducer;
import com.base.repository.*;
import com.base.service.CustomerService;
import com.base.service.helper.OrderCodeGenerator;
import com.base.service.helper.OrderPriceCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderDetailRepository orderDetailRepository;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private CouponRepository couponRepository;
    @Mock private UserRepository userRepository;
    @Mock private PromotionRepository promotionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private CustomerService customerService;
    @Mock private OrderTransactionLogRepository orderTransactionLogRepository;
    @Mock private OrderTransactionLogImageRepository orderTransactionLogImageRepository;
    @Mock private OrderMapper orderMapper;
    @Mock private OrderCodeGenerator codeGenerator;
    @Mock private OrderPriceCalculator calculator;
    @Mock private ModelMapper modelMapper;
    @Mock private EmailProducer emailProducer;
    @Mock private PaymentRepository paymentRepository;
    @Mock private RedisInventoryClaimService redisInventoryClaimService;
    @Mock private CloudinaryService cloudinaryService;

    @InjectMocks private OrderServiceImpl orderService;

    @BeforeEach
    void setUpOrderEvidenceMocks() {
        org.mockito.Mockito.lenient()
                .when(orderTransactionLogRepository.save(any(OrderTransactionLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        org.mockito.Mockito.lenient()
                .when(orderTransactionLogImageRepository.saveAll(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private MockMultipartFile validEvidenceImage() {
        return new MockMultipartFile(
                "images",
                "evidence.jpg",
                "image/jpeg",
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00}
        );
    }

    private void mockEvidenceUpload() {
        when(cloudinaryService.uploadImageWithMetadata(any()))
                .thenReturn(new CloudinaryService.UploadedImage(
                        "https://example.com/evidence.jpg",
                        "orders/evidence"
                ));
    }

    @Test
    void getPosDrafts_shouldRepairLegacyOnlineHoldDeductionWithoutReducingPosStock() {
        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        // Legacy state caused by the old logic: the online hold of 4 and the POS hold
        // of 1 were both deducted from the physical stock of 10.
        variant.setStockQuantity(5);
        variant.setReservedQuantity(5);

        Order draft = new Order();
        draft.setOrderId(1L);
        draft.setOrderType(OrderType.POS);
        draft.setOrderStatus(OrderStatus.DRAFT);
        draft.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(draft);
        detail.setVariant(variant);
        detail.setQuantity(1);
        draft.getOrderDetails().add(detail);

        when(orderRepository.findDraftsByStaff(99L, OrderStatus.DRAFT))
                .thenReturn(List.of(draft));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(reservationRepository.sumActivePosQuantityByVariantId(20L)).thenReturn(1);
        when(variantRepository.save(variant)).thenReturn(variant);
        when(orderMapper.toResponse(draft))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.getPosDrafts(99L);

        assertEquals(9, variant.getStockQuantity());
        assertEquals(1, variant.getReservedQuantity());
        verify(variantRepository).save(variant);
    }

    @Test
    void getTopRatedProductStatistics_shouldOrderAndMapApprovedReviewProjection() {
        ReviewRepository.TopRatedProductStatistic projection =
                mock(ReviewRepository.TopRatedProductStatistic.class);
        when(projection.getProductId()).thenReturn(10L);
        when(projection.getProductName()).thenReturn("Áo được yêu thích");
        when(projection.getAverageRating()).thenReturn(4.8);
        when(projection.getReviewCount()).thenReturn(25L);
        when(reviewRepository.findTopRatedProductStatistics(
                isNull(), isNull(), eq(org.springframework.data.domain.PageRequest.of(0, 5))))
                .thenReturn(List.of(projection));

        var result = orderService.getTopRatedProductStatistics(null, null, 5);

        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).getProductId());
        assertEquals("Áo được yêu thích", result.get(0).getProductName());
        assertEquals(4.8, result.get(0).getAverageRating());
        assertEquals(25L, result.get(0).getReviewCount());
    }

    @Test
    void createOnlineOrder_shouldCreateCodOrderForGuestWithoutCustomer() {
        Product product = new Product();
        product.setProductId(10L);
        product.setProductName("Áo khách vãng lai");
        product.setStatus(ProductStatus.ACTIVE);

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setPrice(new BigDecimal("100000"));
        variant.setStockQuantity(10);
        variant.setStatus(ProductVariantStatus.ACTIVE);

        OrderDetailRequest item = new OrderDetailRequest();
        item.setVariantId(20L);
        item.setQuantity(1);
        item.setPrice(new BigDecimal("100000"));

        OrderAddressRequest addressRequest = new OrderAddressRequest();
        addressRequest.setReceiverName("Khách vãng lai");
        addressRequest.setReceiverPhone("0912345678");
        addressRequest.setProvince("Hà Nội");
        addressRequest.setDistrict("Cầu Giấy");
        addressRequest.setWard("Dịch Vọng");
        addressRequest.setDetailAddress("Số 1 đường Test");

        CreateOrderOnlineRequest request = new CreateOrderOnlineRequest();
        request.setOrderType(OrderType.ONLINE);
        request.setPaymentMethod(PaymentMethod.COD);
        request.setIsGuest(true);
        request.setGuestName("Nguyễn Văn Người Đặt");
        request.setGuestEmail("NguoiDat@Example.com");
        request.setGuestPhone("0901234567");
        request.setItems(List.of(item));
        request.setOrderAddressRequest(addressRequest);
        request.setShippingFee(new BigDecimal("30000"));

        OrderAddress mappedAddress = new OrderAddress();
        mappedAddress.setReceiverName(addressRequest.getReceiverName());
        mappedAddress.setReceiverPhone(addressRequest.getReceiverPhone());

        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        when(variantRepository.findByIdWithAll(20L)).thenReturn(Optional.of(variant));
        when(calculator.applyPromotionToUnit(any(), any(), any(), any(), any()))
                .thenReturn(new BigDecimal("100000"));
        when(calculator.calcTotalAmount(any())).thenReturn(new BigDecimal("100000"));
        when(calculator.calcPromotionOrderDiscount(any(), any())).thenReturn(BigDecimal.ZERO);
        when(calculator.calcCouponDiscount(any(), isNull())).thenReturn(BigDecimal.ZERO);
        when(calculator.calcTotalDiscount(BigDecimal.ZERO, BigDecimal.ZERO)).thenReturn(BigDecimal.ZERO);
        when(calculator.calcFinalAmount(any(), any(), any())).thenReturn(new BigDecimal("130000"));
        when(modelMapper.map(any(OrderAddressRequest.class), eq(OrderAddress.class)))
                .thenReturn(mappedAddress);
        when(codeGenerator.generate()).thenReturn("ORD-GUEST-1");
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(reservationRepository.sumActiveOnlineQuantityByVariantId(20L)).thenReturn(0);
        when(reservationRepository
                .findByOrder_OrderIdAndVariant_VariantIdAndStatus(
                        1L, 20L, Reservation.ReservationStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            saved.setOrderId(1L);
            return saved;
        });
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.createOnlineOrder(request, null);

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        Order savedOrder = orderCaptor.getValue();
        assertNull(savedOrder.getCustomer());
        assertEquals("Nguyễn Văn Người Đặt", savedOrder.getGuestName());
        assertEquals("nguoidat@example.com", savedOrder.getGuestEmail());
        assertEquals("0901234567", savedOrder.getGuestPhone());
        assertEquals(OrderStatus.PENDING, savedOrder.getOrderStatus());
        assertEquals(10, variant.getStockQuantity());
        assertEquals("Khách vãng lai", savedOrder.getOrderAddress().getReceiverName());
        assertEquals(savedOrder, savedOrder.getOrderAddress().getOrder());
        verify(customerRepository, never()).findById(any());
        verify(redisInventoryClaimService, never()).claimStock(any(), any(), anyInt());

        ArgumentCaptor<Reservation> reservationCaptor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(reservationCaptor.capture());
        assertEquals(1, reservationCaptor.getValue().getQuantity());
        assertEquals(Reservation.ReservationStatus.ACTIVE,
                reservationCaptor.getValue().getStatus());

        ArgumentCaptor<EmailMessage> emailCaptor = ArgumentCaptor.forClass(EmailMessage.class);
        verify(emailProducer).sendAfterCommit(emailCaptor.capture());
        assertEquals("nguoidat@example.com", emailCaptor.getValue().getTo());
        assertEquals("Nguyễn Văn Người Đặt", emailCaptor.getValue().getRecipientName());
        assertEquals("Khách vãng lai", emailCaptor.getValue().getData().get("receiverName"));
    }

    @Test
    void createOnlineOrder_shouldRequireGuestPhone() {
        CreateOrderOnlineRequest request = new CreateOrderOnlineRequest();
        request.setOrderType(OrderType.ONLINE);
        request.setPaymentMethod(PaymentMethod.COD);
        request.setIsGuest(true);
        request.setGuestName("Người đặt");
        request.setGuestEmail("guest@example.com");

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.createOnlineOrder(request, null)
        );

        assertEquals("Số điện thoại người đặt không được để trống", exception.getMessage());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOnlineOrder_shouldRejectSecondCodOrderWhenFirstCodOrderHoldsAllStock() {
        Customer customer = new Customer();
        customer.setCustomerId(1L);
        customer.setFullName("Khách hàng");

        Product product = new Product();
        product.setProductId(10L);
        product.setProductName("Áo giới hạn tồn");
        product.setStatus(ProductStatus.ACTIVE);

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setPrice(new BigDecimal("100000"));
        variant.setStockQuantity(2);
        variant.setStatus(ProductVariantStatus.ACTIVE);

        OrderDetailRequest item = new OrderDetailRequest();
        item.setVariantId(20L);
        item.setQuantity(2);
        item.setPrice(new BigDecimal("100000"));

        OrderAddressRequest addressRequest = new OrderAddressRequest();
        addressRequest.setReceiverName("Khách hàng");
        addressRequest.setReceiverPhone("0912345678");
        addressRequest.setProvince("Hà Nội");
        addressRequest.setDistrict("Cầu Giấy");
        addressRequest.setWard("Dịch Vọng");
        addressRequest.setDetailAddress("Số 1 đường Test");

        CreateOrderOnlineRequest request = new CreateOrderOnlineRequest();
        request.setOrderType(OrderType.ONLINE);
        request.setPaymentMethod(PaymentMethod.COD);
        request.setItems(List.of(item));
        request.setOrderAddressRequest(addressRequest);
        request.setShippingFee(BigDecimal.ZERO);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        when(variantRepository.findByIdWithAll(20L)).thenReturn(Optional.of(variant));
        when(calculator.applyPromotionToUnit(any(), any(), any(), any(), any()))
                .thenReturn(new BigDecimal("100000"));
        when(calculator.calcTotalAmount(any())).thenReturn(new BigDecimal("200000"));
        when(calculator.calcPromotionOrderDiscount(any(), any())).thenReturn(BigDecimal.ZERO);
        when(calculator.calcCouponDiscount(any(), isNull())).thenReturn(BigDecimal.ZERO);
        when(calculator.calcTotalDiscount(BigDecimal.ZERO, BigDecimal.ZERO)).thenReturn(BigDecimal.ZERO);
        when(calculator.calcFinalAmount(any(), any(), any())).thenReturn(new BigDecimal("200000"));
        when(modelMapper.map(any(OrderAddressRequest.class), eq(OrderAddress.class)))
                .thenAnswer(invocation -> new OrderAddress());
        when(codeGenerator.generate()).thenReturn("ORD-COD-FIRST", "ORD-COD-SECOND");
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(reservationRepository.sumActiveOnlineQuantityByVariantId(20L))
                .thenReturn(0, 2);
        when(reservationRepository
                .findByOrder_OrderIdAndVariant_VariantIdAndStatus(
                        any(), eq(20L), eq(Reservation.ReservationStatus.ACTIVE)))
                .thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.createOnlineOrder(request, 1L);

        assertEquals(2, variant.getStockQuantity());
        InsufficientStockException exception = assertThrows(
                InsufficientStockException.class,
                () -> orderService.createOnlineOrder(request, 1L)
        );

        assertEquals(
                "Sản phẩm 'Áo giới hạn tồn (null - null)' không đủ tồn kho. Yêu cầu: 2, còn lại: 0",
                exception.getMessage()
        );
        verify(orderRepository, times(2)).save(any(Order.class));
        verify(reservationRepository, times(1)).save(any(Reservation.class));
        verify(redisInventoryClaimService, never()).claimStock(any(), any(), anyInt());
    }

    @Test
    void lookupGuestOrder_shouldRequireMatchingCodeAndOrdererPhone() {
        GuestOrderLookupRequest request = new GuestOrderLookupRequest();
        request.setOrderCode(" ord-guest-1 ");
        request.setPhone("0901234567");

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-GUEST-1");
        order.setGuestPhone("0901234567");

        com.base.dto.response.order.OrderResponse expected =
                new com.base.dto.response.order.OrderResponse();
        expected.setOrderId(1L);
        expected.setOrderCode("ORD-GUEST-1");

        when(orderRepository.findGuestOrderForLookup("ord-guest-1", "0901234567"))
                .thenReturn(Optional.of(order));
        when(orderMapper.toResponse(order)).thenReturn(expected);

        assertEquals(expected, orderService.lookupGuestOrder(request));
        verify(orderRepository).findGuestOrderForLookup("ord-guest-1", "0901234567");
    }

    @Test
    void lookupGuestOrder_shouldHideWhetherCodeOrPhoneWasWrong() {
        GuestOrderLookupRequest request = new GuestOrderLookupRequest();
        request.setOrderCode("ORD-NOT-FOUND");
        request.setPhone("0901234567");

        when(orderRepository.findGuestOrderForLookup("ORD-NOT-FOUND", "0901234567"))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> orderService.lookupGuestOrder(request)
        );

        assertEquals(
                "Không tìm thấy đơn hàng phù hợp với thông tin đã nhập",
                exception.getMessage()
        );
    }

    @Test
    void addPosItem_shouldDeductStockImmediatelyForDraft() {
        User staff = new User();
        staff.setUserId(1L);
        staff.setRole(RoleUser.STAFF);

        Category category = new Category();
        category.setCategoryId(100L);

        Product product = new Product();
        product.setProductId(10L);
        product.setProductName("Áo test");
        product.setCategory(category);

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setPrice(new BigDecimal("100000"));
        variant.setStockQuantity(10);
        variant.setReservedQuantity(0);
        variant.setStatus(ProductVariantStatus.ACTIVE);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderType(OrderType.POS);
        order.setOrderStatus(OrderStatus.DRAFT);
        order.setStaff(staff);
        order.setOrderDetails(new java.util.ArrayList<>());

        PosAddItemRequest request = new PosAddItemRequest();
        request.setVariantId(20L);
        request.setQuantity(2);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(userRepository.findById(1L)).thenReturn(Optional.of(staff));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(variantRepository.save(any(ProductVariant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        when(calculator.applyPromotionToUnit(any(), any(), any(), any(), any()))
                .thenReturn(new BigDecimal("100000"));
        when(reservationRepository
                .findByOrder_OrderIdAndVariant_VariantIdAndStatus(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.addPosItem(1L, request, 1L);

        assertEquals(8, variant.getStockQuantity());
        assertEquals(2, variant.getReservedQuantity());
        assertEquals(2, order.getOrderDetails().get(0).getQuantity());
        verify(variantRepository).save(variant);
    }

    @Test
    void checkoutPosOrder_shouldNotDeductStockTwice() {
        User staff = new User();
        staff.setUserId(1L);
        staff.setRole(RoleUser.STAFF);

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setStockQuantity(8);
        variant.setReservedQuantity(2);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("POS-1");
        order.setOrderType(OrderType.POS);
        order.setOrderStatus(OrderStatus.DRAFT);
        order.setStaff(staff);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        detail.setPrice(new BigDecimal("100000"));
        detail.setSubtotal(new BigDecimal("200000"));
        order.getOrderDetails().add(detail);

        Reservation reservation = Reservation.builder()
                .order(order)
                .variant(variant)
                .quantity(2)
                .status(Reservation.ReservationStatus.ACTIVE)
                .build();

        PosCheckoutRequest request = new PosCheckoutRequest();
        request.setPaymentMethod(PaymentMethod.CASH);
        request.setDelivery(false);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(userRepository.findById(1L)).thenReturn(Optional.of(staff));
        when(calculator.calcTotalAmount(any())).thenReturn(new BigDecimal("200000"));
        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        when(calculator.calcPromotionOrderDiscount(any(), any())).thenReturn(BigDecimal.ZERO);
        when(calculator.calcCouponDiscount(any(), isNull())).thenReturn(BigDecimal.ZERO);
        when(calculator.calcTotalDiscount(BigDecimal.ZERO, BigDecimal.ZERO)).thenReturn(BigDecimal.ZERO);
        when(calculator.calcFinalAmount(any(), any(), any())).thenReturn(new BigDecimal("200000"));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(reservationRepository.sumActivePosQuantityByVariantId(20L)).thenReturn(2);
        when(variantRepository.save(any(ProductVariant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.findByOrder_OrderIdAndStatus(
                1L, Reservation.ReservationStatus.ACTIVE)).thenReturn(List.of(reservation));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.checkoutPosOrder(1L, request, 1L);

        assertEquals(8, variant.getStockQuantity());
        assertEquals(0, variant.getReservedQuantity());
        assertEquals(Reservation.ReservationStatus.COMPLETED, reservation.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getOrderStatus());
        assertNotNull(order.getCompletedAt());
    }

    @Test
    void checkoutPosOrder_shouldRejectCodPayment() {
        PosCheckoutRequest request = new PosCheckoutRequest();
        request.setPaymentMethod(PaymentMethod.COD);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.checkoutPosOrder(1L, request, 1L)
        );

        assertEquals(
                "Bán hàng tại quầy chỉ hỗ trợ tiền mặt hoặc chuyển khoản",
                exception.getMessage()
        );
    }

    @Test
    void checkoutPosOrder_shouldRequireAddressForDelivery() {
        PosCheckoutRequest request = new PosCheckoutRequest();
        request.setPaymentMethod(PaymentMethod.CASH);
        request.setDelivery(true);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.checkoutPosOrder(1L, request, 1L)
        );

        assertEquals(
                "Thông tin nhận hàng không được để trống khi chọn giao hàng",
                exception.getMessage()
        );
    }

    @Test
    void updateOrderStatus_shouldDeductCodStockWhenPendingOrderIsConfirmed() {
        Product product = new Product();
        product.setProductName("Áo COD");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setStockQuantity(8);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-COD-1");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.PENDING);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(redisInventoryClaimService.claimStock(20L, "ORD-COD-1", 2)).thenReturn(true);
        when(variantRepository.save(any(ProductVariant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        Reservation reservation = Reservation.builder()
                .order(order)
                .variant(variant)
                .quantity(2)
                .status(Reservation.ReservationStatus.ACTIVE)
                .build();
        when(reservationRepository.findByOrder_OrderIdAndStatus(
                1L, Reservation.ReservationStatus.ACTIVE))
                .thenReturn(List.of(reservation));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.updateOrderStatus(1L, request, 99L);

        assertEquals(6, variant.getStockQuantity());
        assertEquals(OrderStatus.CONFIRMED, order.getOrderStatus());
        assertEquals(Reservation.ReservationStatus.COMPLETED, reservation.getStatus());
        verify(redisInventoryClaimService).claimStock(20L, "ORD-COD-1", 2);
        verify(variantRepository).save(variant);
    }

    @Test
    void updateOrderStatus_shouldAllowPendingCodOrderMovingToWaitingStock() {
        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setStockQuantity(0);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-COD-WAIT");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.PENDING);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.WAITING_STOCK);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.updateOrderStatus(1L, request, 99L);

        assertEquals(OrderStatus.WAITING_STOCK, order.getOrderStatus());
        assertEquals(0, variant.getStockQuantity());
        verify(redisInventoryClaimService, never()).claimStock(any(), any(), anyInt());
        verify(variantRepository, never()).save(any(ProductVariant.class));
        verify(orderRepository).save(order);
    }

    @Test
    void updateOrderStatus_shouldMovePendingCodOrderToWaitingStockWhenPosUsedInventory() {
        Product product = new Product();
        product.setProductName("Áo COD ưu tiên tại quầy");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setStockQuantity(0);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-COD-PRIORITY");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.PENDING);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(4);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(redisInventoryClaimService.claimStock(20L, "ORD-COD-PRIORITY", 4))
                .thenReturn(false);
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.updateOrderStatus(1L, request, 99L);

        assertEquals(OrderStatus.WAITING_STOCK, order.getOrderStatus());
        assertEquals(0, variant.getStockQuantity());
        verify(redisInventoryClaimService).synchronizeStock(20L, 0);
        verify(variantRepository, never()).save(any(ProductVariant.class));
        verify(orderRepository).save(order);
    }

    @Test
    void updateOrderStatus_shouldRejectWaitingStockWhenInventoryIsSufficient() {
        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setStockQuantity(5);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-COD-IN-STOCK");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.PENDING);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.WAITING_STOCK);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));

        assertThrows(com.base.exception.BadRequestException.class,
                () -> orderService.updateOrderStatus(1L, request, 99L));

        assertEquals(OrderStatus.PENDING, order.getOrderStatus());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void updateOrderStatus_shouldDeductStockWhenWaitingStockOrderIsConfirmed() {
        Product product = new Product();
        product.setProductName("Áo chờ nhập");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setStockQuantity(5);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-COD-WAIT");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.WAITING_STOCK);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(redisInventoryClaimService.claimStock(20L, "ORD-COD-WAIT", 2)).thenReturn(true);
        when(variantRepository.save(any(ProductVariant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.updateOrderStatus(1L, request, 99L);

        assertEquals(OrderStatus.CONFIRMED, order.getOrderStatus());
        assertEquals(3, variant.getStockQuantity());
        verify(redisInventoryClaimService).synchronizeStock(20L, 5);
        verify(redisInventoryClaimService).claimStock(20L, "ORD-COD-WAIT", 2);
    }

    @Test
    void updateOrderStatus_shouldExplainMissingStockWhenWaitingOrderIsConfirmed() {
        Product product = new Product();
        product.setProductName("Áo chờ nhập");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setStockQuantity(1);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-COD-WAIT");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.WAITING_STOCK);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(redisInventoryClaimService.claimStock(20L, "ORD-COD-WAIT", 2))
                .thenReturn(false);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.updateOrderStatus(1L, request, 99L)
        );

        assertEquals(
                "Chưa thể xác nhận đã đủ hàng. Sản phẩm 'Áo chờ nhập (null - null)' "
                        + "không đủ tồn kho. Yêu cầu: 2, còn lại: 1",
                exception.getMessage()
        );
        assertEquals(OrderStatus.WAITING_STOCK, order.getOrderStatus());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void cancelOrderByUser_shouldReleaseHoldWithoutRestoringPendingCodStock() {
        Customer customer = new Customer();
        customer.setCustomerId(1L);

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setStockQuantity(8);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-COD-2");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.PENDING);
        order.setCustomer(customer);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        Reservation reservation = Reservation.builder()
                .order(order)
                .variant(variant)
                .quantity(2)
                .status(Reservation.ReservationStatus.ACTIVE)
                .build();
        when(reservationRepository.findByOrder_OrderIdAndStatus(
                1L, Reservation.ReservationStatus.ACTIVE))
                .thenReturn(List.of(reservation));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.cancelOrderByUser(1L, 1L, "Đổi ý");

        assertEquals(8, variant.getStockQuantity());
        assertEquals(OrderStatus.CANCELLED, order.getOrderStatus());
        assertEquals(Reservation.ReservationStatus.RELEASED, reservation.getStatus());
        verify(redisInventoryClaimService).releaseStock(20L, "ORD-COD-2", 2);
        verify(variantRepository, never()).save(any(ProductVariant.class));
    }

    @Test
    void cancelOrderByUser_shouldRejectConfirmedOrder() {
        Customer customer = new Customer();
        customer.setCustomerId(1L);
        customer.setFullName("Khách A");

        Product product = new Product();
        product.setProductId(10L);
        product.setProductName("Áo test");
        product.setStatus(com.base.enums.ProductStatus.ACTIVE);

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setPrice(new BigDecimal("100000"));
        variant.setStockQuantity(10);
        variant.setStatus(ProductVariantStatus.ACTIVE);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setCustomer(customer);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.cancelOrderByUser(1L, 1L, "test hủy")
        );

        assertEquals(
                "Đơn hàng đã được xác nhận nên bạn không thể hủy. "
                        + "Vui lòng liên hệ cửa hàng nếu cần hỗ trợ.",
                exception.getMessage()
        );
        assertEquals(OrderStatus.CONFIRMED, order.getOrderStatus());
        assertEquals(10, variant.getStockQuantity());
        verify(orderRepository, never()).save(any(Order.class));
        verify(redisInventoryClaimService, never()).releaseStock(any(), any(), anyInt());
    }

    @Test
    void updateOrderStatus_shouldAllowAdminToCancelConfirmedOrder() {
        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-CONFIRMED-1");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setOrderDetails(new java.util.ArrayList<>());

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.CANCELLED);
        request.setNote("Quản trị viên xác nhận hủy");

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.updateOrderStatus(1L, request, 99L);

        assertEquals(OrderStatus.CANCELLED, order.getOrderStatus());
        assertEquals("Quản trị viên xác nhận hủy", order.getNote());
        verify(orderRepository).save(order);
    }

    @Test
    void updateOrderStatus_shouldRejectCompletedToRefundedDirectly() {
        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.COMPLETED);
        order.setOrderDetails(new java.util.ArrayList<>());

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.REFUNDED);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));

        assertThrows(
                com.base.exception.BadRequestException.class,
                () -> orderService.updateOrderStatus(1L, request, 99L)
        );
    }

    @Test
    void updateOrderStatus_shouldNotRestoreStockWhenDeliveryFails() {
        Product product = new Product();
        product.setProductName("Áo test");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setStockQuantity(8);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-1");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.SHIPPING);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.FAILED_DELIVERY);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());
        mockEvidenceUpload();

        orderService.updateOrderStatus(1L, request, 99L, List.of(validEvidenceImage()));

        assertEquals(8, variant.getStockQuantity());
        assertEquals(OrderStatus.FAILED_DELIVERY, order.getOrderStatus());
        assertEquals(1, order.getTransactionLogs().size());
        assertEquals(1, order.getTransactionLogs().get(0).getImages().size());
        assertEquals(
                "https://example.com/evidence.jpg",
                order.getTransactionLogs().get(0).getImages().get(0).getImageUrl()
        );
    }

    @Test
    void updateOrderStatus_shouldRestoreStockOnlyWhenReturnedToShop() {
        Product product = new Product();
        product.setProductName("Áo test");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setStockQuantity(8);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-1");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.RETURNING);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setQuantity(2);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.RETURNED_TO_SHOP);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(variantRepository.save(any(ProductVariant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(redisInventoryClaimService.releaseStock(any(), any(), anyInt())).thenReturn(true);
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.updateOrderStatus(1L, request, 99L);

        assertEquals(10, variant.getStockQuantity());
        assertEquals(OrderStatus.RETURNED_TO_SHOP, order.getOrderStatus());
    }

    @Test
    void updateOrderStatus_shouldStoreDamageBreakdownAndRestoreOnlyUndamagedStock() {
        Product product = new Product();
        product.setProductName("Áo test");

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setStockQuantity(8);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-1");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.SHIPPING);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setProductName("Áo test");
        detail.setQuantity(3);
        order.getOrderDetails().add(detail);

        UpdateOrderStatusRequest.DamagedItemRequest damagedItem =
                new UpdateOrderStatusRequest.DamagedItemRequest();
        damagedItem.setVariantId(20L);
        damagedItem.setDamagedQuantity(1);

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.CANCELED_BY_DAMAGED);
        request.setDamagedItems(List.of(damagedItem));

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(variantRepository.findById(20L)).thenReturn(Optional.of(variant));
        when(variantRepository.save(any(ProductVariant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(redisInventoryClaimService.releaseStock(any(), any(), anyInt())).thenReturn(true);
        when(orderMapper.toResponse(any(Order.class)))
                .thenReturn(new com.base.dto.response.order.OrderResponse());
        mockEvidenceUpload();

        orderService.updateOrderStatus(1L, request, 99L, List.of(validEvidenceImage()));

        assertEquals(1, detail.getDamagedQuantity());
        assertEquals(10, variant.getStockQuantity());
        assertEquals(OrderStatus.CANCELED_BY_DAMAGED, order.getOrderStatus());
    }

    @Test
    void updateOrderStatus_shouldRequireDamageBreakdownForDamagedCancellation() {
        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-1");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.SHIPPING);
        order.setOrderDetails(new java.util.ArrayList<>());

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.CANCELED_BY_DAMAGED);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        mockEvidenceUpload();

        assertThrows(
                com.base.exception.BadRequestException.class,
                () -> orderService.updateOrderStatus(
                        1L,
                        request,
                        99L,
                        List.of(validEvidenceImage())
                )
        );
    }

    @Test
    void updateOrderStatus_shouldRequireEvidenceForFailedDelivery() {
        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderCode("ORD-1");
        order.setOrderType(OrderType.ONLINE);
        order.setOrderStatus(OrderStatus.SHIPPING);
        order.setOrderDetails(new java.util.ArrayList<>());

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setOrderStatus(OrderStatus.FAILED_DELIVERY);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.updateOrderStatus(1L, request, 99L)
        );

        org.junit.jupiter.api.Assertions.assertTrue(
                exception.getMessage().contains("bắt buộc phải có ít nhất một ảnh")
        );
        verify(orderRepository, never()).save(any(Order.class));
        verify(cloudinaryService, never()).uploadImageWithMetadata(any());
    }

    @Test
    void bulkUpdateOrderStatus_shouldRejectStatusesThatRequireEvidence() {
        com.base.dto.request.order.BulkUpdateOrderStatusRequest request =
                new com.base.dto.request.order.BulkUpdateOrderStatusRequest();
        request.setOrderIds(List.of(1L, 2L));
        request.setOrderStatus(OrderStatus.RETURNING);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.bulkUpdateOrderStatus(request, 99L)
        );

        org.junit.jupiter.api.Assertions.assertTrue(
                exception.getMessage().contains("cần ảnh xác nhận")
        );
        verify(orderRepository, never()).findByIdWithDetails(any());
    }

    @Test
    void updatePosItem_shouldUseEffectivePriceWhenRecalculatingSubtotal() {
        User staff = new User();
        staff.setUserId(1L);
        staff.setRole(RoleUser.STAFF);
        staff.setFullName("Nhân viên A");

        Product product = new Product();
        product.setProductId(10L);
        product.setProductName("Áo test");
        product.setStatus(ProductStatus.ACTIVE);

        Category category = new Category();
        category.setCategoryId(100L);
        product.setCategory(category);

        ProductVariant variant = new ProductVariant();
        variant.setVariantId(20L);
        variant.setProduct(product);
        variant.setPrice(new BigDecimal("100000"));
        variant.setStockQuantity(10);
        variant.setStatus(ProductVariantStatus.ACTIVE);

        Order order = new Order();
        order.setOrderId(1L);
        order.setOrderType(OrderType.POS);
        order.setOrderStatus(OrderStatus.DRAFT);
        order.setStaff(staff);
        order.setOrderDetails(new java.util.ArrayList<>());

        OrderDetail detail = new OrderDetail();
        detail.setOrderDetailId(30L);
        detail.setOrder(order);
        detail.setVariant(variant);
        detail.setPrice(new BigDecimal("100000"));
        detail.setSalePrice(new BigDecimal("80000"));
        detail.setQuantity(1);
        detail.setSubtotal(new BigDecimal("80000"));
        order.getOrderDetails().add(detail);

        PosUpdateItemRequest request = new PosUpdateItemRequest();
        request.setQuantity(3);

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(order));
        when(userRepository.findById(1L)).thenReturn(Optional.of(staff));
        when(variantRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(variant));
        when(variantRepository.save(any(ProductVariant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        when(calculator.applyPromotionToUnit(any(), any(), any(), any(), any())).thenReturn(new BigDecimal("80000"));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.findByOrder_OrderIdAndVariant_VariantIdAndStatus(any(), any(), any())).thenReturn(Optional.empty());
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(new com.base.dto.response.order.OrderResponse());

        orderService.updatePosItem(1L, 30L, request, 1L);

        assertEquals(new BigDecimal("240000"), detail.getSubtotal());
        assertEquals(8, variant.getStockQuantity());
        assertEquals(2, variant.getReservedQuantity());
    }
}
