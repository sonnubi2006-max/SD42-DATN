package com.base.controller;

import com.base.dto.request.payment.InitPaymentRequest;
import com.base.dto.request.payment.GuestPaymentRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.payment.InitPaymentResponse;
import com.base.dto.response.payment.PaymentResponse;
import com.base.dto.response.payment.VNPayCallbackParams;
import com.base.service.PaymentService;
import com.base.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final SecurityUtils securityUtils;

    @PostMapping("/init")
    public ResponseEntity<ApiResponse<InitPaymentResponse>> initPayment(
            @Valid @RequestBody InitPaymentRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        return ResponseEntity.ok(ApiResponse.success(paymentService.initPayment(
                request, clientIp, getCurrentUserId(), securityUtils.hasAnyRole("ADMIN", "STAFF"))));
    }

    @PostMapping("/guest/init")
    public ResponseEntity<ApiResponse<InitPaymentResponse>> initGuestPayment(
            @Valid @RequestBody GuestPaymentRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.initGuestPayment(request, getClientIp(httpRequest))));
    }

    @PostMapping("/guest/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> getGuestPaymentStatus(
            @Valid @RequestBody GuestPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.getGuestPayment(request)));
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<ApiResponse<PaymentResponse>> handleReturn(
            @ModelAttribute VNPayCallbackParams params
    ) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.handleReturn(params)));
    }

    @GetMapping("/vnpay/ipn")
    public ResponseEntity<String> handleIpn(
            @ModelAttribute VNPayCallbackParams params
    ) {
        String result = paymentService.handleIpn(params);
        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .body(result);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getByOrderId(
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getByOrderId(
                orderId, getCurrentUserId(), securityUtils.hasAnyRole("ADMIN", "STAFF"))));
    }

    @PostMapping("/order/{orderId}/refund")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Boolean>> refundPayment(
            @PathVariable Long orderId,
            @RequestParam @jakarta.validation.constraints.Positive java.math.BigDecimal amount,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        Long currentUserId = getCurrentUserId();
        String createBy = "Admin_ID_" + currentUserId;
        boolean success = paymentService.refundPayment(orderId, amount, clientIp, createBy);
        return ResponseEntity.ok(ApiResponse.success(success));
    }

    @PostMapping("/order/{orderId}/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> syncTransaction(
            @PathVariable Long orderId,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        return ResponseEntity.ok(ApiResponse.success(paymentService.queryTransaction(orderId, clientIp)));
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            ip = "127.0.0.1";
        }
        return ip;
    }

    private Long getCurrentUserId() {
        return securityUtils.getCurrentUserId();
    }
}
