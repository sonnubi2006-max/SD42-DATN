package com.base.service.impl;

import com.base.config.VNPayConfig;
import com.base.dto.request.payment.InitPaymentRequest;
import com.base.dto.response.payment.PaymentResponse;
import com.base.dto.response.payment.VNPayCallbackParams;
import com.base.entity.Customer;
import com.base.entity.Order;
import com.base.entity.Payment;
import com.base.enums.PaymentMethod;
import com.base.enums.PaymentStatus;
import com.base.enums.OrderStatus;
import com.base.exception.BadRequestException;
import com.base.mapper.PaymentMapper;
import com.base.repository.OrderRepository;
import com.base.repository.PaymentRepository;
import com.base.service.OrderService;
import com.base.utils.VNPayUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private VNPayUtil vnpayUtil;
    @Mock private VNPayConfig vnpayConfig;
    @Mock private PaymentMapper paymentMapper;
    @Mock private RestTemplate restTemplate;
    @Mock private ObjectMapper objectMapper;
    @Mock private OrderService orderService;

    @InjectMocks private PaymentServiceImpl paymentService;

    @Test
    void getByOrderId_shouldRejectAnotherCustomer() {
        Payment payment = payment(1L, new BigDecimal("100000"));
        when(paymentRepository.findByOrder_OrderId(10L)).thenReturn(Optional.of(payment));

        assertThrows(
                AccessDeniedException.class,
                () -> paymentService.getByOrderId(10L, 2L, false)
        );
    }

    @Test
    void handleReturn_shouldRejectMismatchedAmount() {
        Payment payment = payment(1L, new BigDecimal("100000"));
        VNPayCallbackParams params = successfulParams("9999900");

        when(vnpayUtil.verifySignature(anyMap())).thenReturn(true);
        when(paymentRepository.findByOrderCodeWithOrderForUpdate("ORD-1")).thenReturn(Optional.of(payment));

        assertThrows(BadRequestException.class, () -> paymentService.handleReturn(params));
    }

    @Test
    void handleReturn_shouldConfirmSignedSuccessfulPaymentWhenIpnIsUnavailable() {
        Payment payment = payment(1L, new BigDecimal("100000"));
        VNPayCallbackParams params = successfulParams("10000000");
        PaymentResponse response = new PaymentResponse();

        when(vnpayUtil.verifySignature(anyMap())).thenReturn(true);
        when(paymentRepository.findByOrderCodeWithOrderForUpdate("ORD-1")).thenReturn(Optional.of(payment));
        when(paymentMapper.toResponse(payment)).thenReturn(response);

        paymentService.handleReturn(params);

        verify(orderService).confirmPaidOnlineOrder(10L);
        verify(paymentRepository).save(payment);
    }

    @Test
    void refundPayment_shouldRejectNonPositiveAmount() {
        assertThrows(
                BadRequestException.class,
                () -> paymentService.refundPayment(10L, BigDecimal.ZERO, "127.0.0.1", "test")
        );
    }

    @Test
    void initPayment_shouldRejectMissingVnpayCredentials() {
        Customer customer = new Customer();
        customer.setCustomerId(1L);

        Order order = new Order();
        order.setOrderId(10L);
        order.setCustomer(customer);
        order.setOrderStatus(OrderStatus.WAITING_PAYMENT);
        order.setPaymentMethod(PaymentMethod.VNPAY);

        InitPaymentRequest request = new InitPaymentRequest();
        request.setOrderId(10L);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        assertThrows(
                BadRequestException.class,
                () -> paymentService.initPayment(request, "127.0.0.1", 1L, false)
        );
    }

    private Payment payment(Long customerId, BigDecimal amount) {
        Customer customer = new Customer();
        customer.setCustomerId(customerId);

        Order order = new Order();
        order.setOrderId(10L);
        order.setOrderCode("ORD-1");
        order.setCustomer(customer);

        return Payment.builder()
                .order(order)
                .amount(amount)
                .paymentMethod(PaymentMethod.VNPAY)
                .paymentStatus(PaymentStatus.PENDING)
                .build();
    }

    private VNPayCallbackParams successfulParams(String amount) {
        VNPayCallbackParams params = new VNPayCallbackParams();
        params.setVnp_TxnRef("ORD-1");
        params.setVnp_Amount(amount);
        params.setVnp_ResponseCode("00");
        params.setVnp_TransactionStatus("00");
        params.setVnp_SecureHash("valid");
        return params;
    }
}
