package com.base.mapper;

import com.base.dto.response.order.OrderDetailResponse;
import com.base.dto.response.order.OrderResponse;
import com.base.entity.Order;
import com.base.entity.OrderDetail;
import com.base.entity.ProductVariant;
import com.base.entity.ReturnRequest;
import com.base.entity.Customer;
import com.base.entity.ExchangeDelivery;
import com.base.enums.CustomerSource;
import com.base.enums.ExchangeDeliveryStatus;
import com.base.enums.ExchangeFulfillmentMethod;
import com.base.enums.OrderStatus;
import com.base.enums.ReturnStatus;
import com.base.enums.ReturnType;
import com.base.repository.PromotionRepository;
import com.base.repository.ExchangeDeliveryRepository;
import com.base.repository.AddressRepository;
import com.base.repository.ReturnRequestRepository;
import com.base.service.helper.OrderPriceCalculator;
import com.base.service.helper.ReturnPolicy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderMapperTest {

    @Mock private ModelMapper modelMapper;
    @Mock private ReturnRequestRepository returnRepository;
    @Mock private PromotionRepository promotionRepository;
    @Mock private ExchangeDeliveryRepository exchangeDeliveryRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private OrderPriceCalculator calculator;
    @Mock private ReturnPolicy returnPolicy;

    @InjectMocks private OrderMapper orderMapper;

    @Test
    void toResponse_shouldExposeCompletedReturnsAndNetRevenue() {
        Order order = new Order();
        order.setOrderId(10L);
        order.setOrderStatus(OrderStatus.COMPLETED);
        order.setFinalAmount(new BigDecimal("550000"));
        order.setShippingFee(new BigDecimal("50000"));
        order.setOrderDetails(new ArrayList<>());
        order.setTransactionLogs(new ArrayList<>());

        ReturnRequest refund = ReturnRequest.builder()
                .returnId(100L)
                .order(order)
                .orderCode("ORD-10")
                .status(ReturnStatus.COMPLETED)
                .returnType(ReturnType.REFUND)
                .refundAmount(new BigDecimal("120000"))
                .items(new ArrayList<>())
                .exchangeItems(new ArrayList<>())
                .build();

        when(modelMapper.map(order, OrderResponse.class))
                .thenReturn(new OrderResponse());
        when(returnRepository.findCompletedByOrderIdWithItems(10L))
                .thenReturn(List.of(refund));
        when(exchangeDeliveryRepository.findByReturnRequest_ReturnId(100L))
                .thenReturn(java.util.Optional.empty());
        when(returnPolicy.evaluate(order))
                .thenReturn(new ReturnPolicy.ReturnWindow(
                        LocalDateTime.of(2026, 7, 30, 10, 0),
                        LocalDateTime.of(2026, 8, 6, 10, 0),
                        false
                ));

        OrderResponse response = orderMapper.toResponse(order);

        assertEquals(1, response.getCompletedReturnCount());
        assertEquals(new BigDecimal("120000"), response.getCompletedRefundAmount());
        assertEquals(new BigDecimal("380000"), response.getNetRevenue());
        assertEquals(100L, response.getReturnRequests().get(0).getReturnId());
    }

    @Test
    void toDetailResponse_shouldIncludeItemQuantityInStockQuantityForDraftOrders() {
        ProductVariant variant = new ProductVariant();
        variant.setVariantId(1L);
        variant.setStockQuantity(74);

        Order order = new Order();
        order.setOrderId(10L);
        order.setOrderStatus(OrderStatus.DRAFT);

        OrderDetail detail = new OrderDetail();
        detail.setVariant(variant);
        detail.setOrder(order);
        detail.setQuantity(1);

        OrderDetailResponse mappedResponse = new OrderDetailResponse();
        when(modelMapper.map(detail, OrderDetailResponse.class))
                .thenReturn(mappedResponse);
        when(promotionRepository.findActivePromotions(any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());
        when(calculator.applyPromotionToUnit(any(), any(), any(), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(returnRepository.sumActiveReturnedQuantity(anyLong(), anyLong()))
                .thenReturn(0);

        OrderDetailResponse res = orderMapper.toDetailResponse(detail);

        assertEquals(75, res.getStockQuantity());
    }

    @Test
    void toResponse_shouldExposeRegisteredCustomerAndExchangeDeliveryStatus() {
        Customer customer = Customer.builder()
                .customerId(7L)
                .source(CustomerSource.REGISTERED)
                .email("customer@example.com")
                .build();
        Order order = new Order();
        order.setOrderId(11L);
        order.setCustomer(customer);
        order.setOrderStatus(OrderStatus.COMPLETED);
        order.setFinalAmount(new BigDecimal("300000"));
        order.setShippingFee(new BigDecimal("35000"));
        order.setOrderDetails(new ArrayList<>());
        order.setTransactionLogs(new ArrayList<>());

        ReturnRequest exchange = ReturnRequest.builder()
                .returnId(101L)
                .order(order)
                .customer(customer)
                .orderCode("ORD-11")
                .customerName("Khách hàng")
                .status(ReturnStatus.COMPLETED)
                .returnType(ReturnType.EXCHANGE)
                .exchangeFulfillmentMethod(ExchangeFulfillmentMethod.DELIVERY)
                .refundAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .exchangeItems(new ArrayList<>())
                .build();
        ExchangeDelivery delivery = ExchangeDelivery.builder()
                .exchangeDeliveryId(201L)
                .returnRequest(exchange)
                .deliveryCode("EXD-201")
                .status(ExchangeDeliveryStatus.SHIPPING)
                .fulfillmentMethod(ExchangeFulfillmentMethod.DELIVERY)
                .build();

        when(modelMapper.map(order, OrderResponse.class)).thenReturn(new OrderResponse());
        when(addressRepository.findByCustomerCustomerIdAndIsDefaultTrue(7L))
                .thenReturn(java.util.Optional.empty());
        when(returnRepository.findCompletedByOrderIdWithItems(11L))
                .thenReturn(List.of(exchange));
        when(exchangeDeliveryRepository.findByReturnRequest_ReturnId(101L))
                .thenReturn(java.util.Optional.of(delivery));
        when(returnPolicy.evaluate(order)).thenReturn(new ReturnPolicy.ReturnWindow(
                LocalDateTime.of(2026, 8, 1, 10, 0),
                LocalDateTime.of(2026, 8, 8, 10, 0),
                true
        ));

        OrderResponse response = orderMapper.toResponse(order);

        assertEquals(CustomerSource.REGISTERED, response.getCustomerSource());
        assertEquals(ExchangeDeliveryStatus.SHIPPING,
                response.getReturnRequests().get(0).getExchangeDelivery().getStatus());
        assertEquals("EXD-201",
                response.getReturnRequests().get(0).getExchangeDelivery().getDeliveryCode());
    }

    @Test
    void toDetailResponse_shouldNotIncludeItemQuantityInStockQuantityForNonDraftOrders() {
        ProductVariant variant = new ProductVariant();
        variant.setVariantId(1L);
        variant.setStockQuantity(74);

        Order order = new Order();
        order.setOrderId(10L);
        order.setOrderStatus(OrderStatus.COMPLETED);

        OrderDetail detail = new OrderDetail();
        detail.setVariant(variant);
        detail.setOrder(order);
        detail.setQuantity(1);

        OrderDetailResponse mappedResponse = new OrderDetailResponse();
        when(modelMapper.map(detail, OrderDetailResponse.class))
                .thenReturn(mappedResponse);
        when(promotionRepository.findActivePromotions(any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());
        when(calculator.applyPromotionToUnit(any(), any(), any(), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(returnRepository.sumActiveReturnedQuantity(anyLong(), anyLong()))
                .thenReturn(0);

        OrderDetailResponse res = orderMapper.toDetailResponse(detail);

        assertEquals(74, res.getStockQuantity());
    }
}
