package com.base.service;

import com.base.dto.request.payment.InitPaymentRequest;
import com.base.dto.request.payment.GuestPaymentRequest;
import com.base.dto.response.payment.InitPaymentResponse;
import com.base.dto.response.payment.PaymentResponse;
import com.base.dto.response.payment.VNPayCallbackParams;

public interface PaymentService {

    InitPaymentResponse initPayment(InitPaymentRequest request, String clientIp, Long userId, boolean manager);

    InitPaymentResponse initGuestPayment(GuestPaymentRequest request, String clientIp);

    PaymentResponse handleReturn(VNPayCallbackParams params);

    String handleIpn(VNPayCallbackParams params);

    PaymentResponse getByOrderId(Long orderId, Long userId, boolean manager);

    PaymentResponse getGuestPayment(GuestPaymentRequest request);

    PaymentResponse queryTransaction(Long orderId, String clientIp);

    boolean refundPayment(Long orderId, java.math.BigDecimal refundAmount, String clientIp, String createBy);
}
