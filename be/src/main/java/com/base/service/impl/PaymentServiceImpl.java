package com.base.service.impl;

import com.base.config.VNPayConfig;
import com.base.dto.request.payment.GuestPaymentRequest;
import com.base.dto.request.payment.InitPaymentRequest;
import com.base.dto.response.payment.InitPaymentResponse;
import com.base.dto.response.payment.PaymentResponse;
import com.base.dto.response.payment.VNPayCallbackParams;
import com.base.entity.Order;
import com.base.entity.Payment;
import com.base.enums.OrderStatus;
import com.base.enums.PaymentMethod;
import com.base.enums.PaymentStatus;
import com.base.exception.BadRequestException;
import com.base.mapper.PaymentMapper;
import com.base.repository.OrderRepository;
import com.base.repository.PaymentRepository;
import com.base.service.OrderService;
import com.base.service.PaymentService;
import com.base.utils.VNPayUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final DateTimeFormatter VNPAY_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final PaymentRepository paymentRepository;
    private final OrderRepository   orderRepository;
    private final VNPayUtil         vnpayUtil;
    private final VNPayConfig       vnpayConfig;
    private final PaymentMapper     paymentMapper;
    private final RestTemplate      restTemplate;
    private final ObjectMapper      objectMapper;
    private final OrderService      orderService;

    @Override
    @Transactional
    public InitPaymentResponse initPayment(InitPaymentRequest request,
                                           String clientIp,
                                           Long userId,
                                           boolean manager) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new BadRequestException(
                        "Đơn hàng không tồn tại: " + request.getOrderId()));

        if (!manager && (userId == null || order.getCustomer() == null
                || !order.getCustomer().getCustomerId().equals(userId))) {
            throw new AccessDeniedException("Bạn không có quyền thanh toán đơn hàng này");
        }

        String requestedIp = request.getClientIp() != null
                ? request.getClientIp()
                : clientIp;
        return initializeVnpayPayment(order, requestedIp);
    }

    @Override
    @Transactional
    public InitPaymentResponse initGuestPayment(
            GuestPaymentRequest request,
            String clientIp
    ) {
        Order order = verifyGuestOrder(request);
        return initializeVnpayPayment(order, clientIp);
    }

    private InitPaymentResponse initializeVnpayPayment(Order order, String clientIp) {

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng đã bị huỷ, không thể thanh toán");
        }

        if (order.getOrderStatus() != OrderStatus.WAITING_PAYMENT) {
            throw new BadRequestException("Chỉ có thể thanh toán đơn đang chờ thanh toán");
        }

        if (order.getPaymentMethod() != PaymentMethod.VNPAY) {
            throw new BadRequestException("Đơn hàng không sử dụng phương thức thanh toán VNPay");
        }

        if (!vnpayConfig.isPaymentConfigured()) {
            throw new BadRequestException(
                    "VNPay chưa được cấu hình đầy đủ, không thể tạo giao dịch thanh toán thật");
        }

        if (paymentRepository.existsByOrder_OrderIdAndPaymentStatus(
                order.getOrderId(), PaymentStatus.PAID)) {
            throw new BadRequestException("Đơn hàng đã được thanh toán");
        }

        Payment payment = paymentRepository
                .findByOrder_OrderId(order.getOrderId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(order.getFinalAmount())
                        .paymentMethod(PaymentMethod.VNPAY)
                        .paymentStatus(PaymentStatus.PENDING)
                        .build());

        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment.setTransactionCode(null);
        Payment saved = paymentRepository.save(payment);

        LocalDateTime baseTime = order.getOrderDate() != null ? order.getOrderDate() : order.getCreatedAt();
        if (baseTime == null) {
            baseTime = LocalDateTime.now();
        }
        LocalDateTime expireTime = baseTime.plusMinutes(vnpayConfig.getExpireMinutes());

        if (expireTime.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Thời gian thanh toán cho đơn hàng này đã hết hạn!");
        }

        String paymentUrl = vnpayUtil.buildPaymentUrl(
                order.getOrderCode(),
                order.getFinalAmount().longValue(),
                "Thanh toan don hang " + order.getOrderCode(),
                clientIp,
                expireTime
        );

        log.info("Khởi tạo thanh toán VNPay: orderId={} orderCode={} amount={}",
                order.getOrderId(), order.getOrderCode(), order.getFinalAmount());

        return InitPaymentResponse.builder()
                .paymentId(saved.getPaymentId())
                .orderCode(order.getOrderCode())
                .amount(order.getFinalAmount())
                .paymentUrl(paymentUrl)
                .status(PaymentStatus.PENDING)
                .expireAt(expireTime)
                .build();
    }

    private Order verifyGuestOrder(GuestPaymentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new BadRequestException(
                        "Không thể xác thực thông tin thanh toán của đơn hàng"));

        String requestedCode = request.getOrderCode().trim();
        String requestedPhone = normalizePhone(request.getPhone());
        String orderPhone = normalizePhone(order.getGuestPhone());
        boolean validGuestOrder = order.getCustomer() == null
                && order.getOrderCode() != null
                && order.getOrderCode().equalsIgnoreCase(requestedCode)
                && orderPhone != null
                && orderPhone.equals(requestedPhone);
        if (!validGuestOrder) {
            throw new BadRequestException(
                    "Mã đơn hàng hoặc số điện thoại người đặt không chính xác");
        }
        return order;
    }

    private String normalizePhone(String phone) {
        return phone == null ? null : phone.trim().replaceAll("[\\s.-]", "");
    }

    @Override
    @Transactional
    public PaymentResponse handleReturn(VNPayCallbackParams params) {
        log.info("VNPay Return URL: orderCode={} responseCode={}",
                params.getVnp_TxnRef(), params.getVnp_ResponseCode());

        if (!vnpayUtil.verifySignature(params.toMap())) {
            log.warn("VNPay Return: chữ ký không hợp lệ, orderCode={}", params.getVnp_TxnRef());
            throw new IllegalStateException("Chữ ký không hợp lệ");
        }

        Payment payment = paymentRepository
                .findByOrderCodeWithOrderForUpdate(params.getVnp_TxnRef())
                .orElseThrow(() -> new BadRequestException(
                        "Không tìm thấy payment cho đơn: " + params.getVnp_TxnRef()));

        validateCallbackAmount(params, payment);

        // VNPay cannot call a localhost IPN URL during local/sandbox testing.
        // The browser return parameters are still signed by VNPay, so process
        // them idempotently when IPN has not already completed the payment.
        if (payment.getPaymentStatus() != PaymentStatus.PAID) {
            if (params.isSuccess()) {
                payment.setPaymentStatus(PaymentStatus.PAID);
                payment.setTransactionCode(params.getVnp_TransactionNo());
                payment.setBankCode(params.getVnp_BankCode());
                payment.setCardType(params.getVnp_CardType());
                payment.setVnpResponseCode(params.getVnp_ResponseCode());
                payment.setPaidAt(parseVnpayDate(params.getVnp_PayDate()));
                orderService.confirmPaidOnlineOrder(payment.getOrder().getOrderId());
            } else {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                payment.setVnpResponseCode(params.getVnp_ResponseCode());
            }
            paymentRepository.save(payment);
        }

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional
    public String handleIpn(VNPayCallbackParams params) {
        log.info("VNPay IPN: orderCode={} responseCode={} transactionNo={}",
                params.getVnp_TxnRef(),
                params.getVnp_ResponseCode(),
                params.getVnp_TransactionNo());

        if (!vnpayUtil.verifySignature(params.toMap())) {
            log.error("VNPay IPN: chữ ký không hợp lệ, orderCode={}", params.getVnp_TxnRef());
            return "{\"RspCode\":\"97\",\"Message\":\"Invalid signature\"}";
        }

        Payment payment = paymentRepository
                .findByOrderCodeWithOrderForUpdate(params.getVnp_TxnRef())
                .orElse(null);

        if (payment == null) {
            log.error("VNPay IPN: không tìm thấy đơn hàng, orderCode={}", params.getVnp_TxnRef());
            return "{\"RspCode\":\"01\",\"Message\":\"Order not found\"}";
        }

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            log.warn("VNPay IPN: đơn đã xử lý, orderCode={}", params.getVnp_TxnRef());
            return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";
        }

        try {
            validateCallbackAmount(params, payment);
        } catch (BadRequestException ex) {
            log.error("VNPay IPN: số tiền không khớp. Expected={} Got={}",
                    payment.getAmount(), params.getVnp_Amount());
            return "{\"RspCode\":\"04\",\"Message\":\"Invalid amount\"}";
        }

        if (params.isSuccess()) {
            payment.setPaymentStatus(PaymentStatus.PAID);
            payment.setTransactionCode(params.getVnp_TransactionNo());
            payment.setBankCode(params.getVnp_BankCode());
            payment.setCardType(params.getVnp_CardType());
            payment.setVnpResponseCode(params.getVnp_ResponseCode());
            payment.setPaidAt(parseVnpayDate(params.getVnp_PayDate()));

            Order order = payment.getOrder();
            orderService.confirmPaidOnlineOrder(order.getOrderId());

            log.info("VNPay IPN: thanh toán thành công. orderCode={} transactionNo={}",
                    params.getVnp_TxnRef(), params.getVnp_TransactionNo());
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setVnpResponseCode(params.getVnp_ResponseCode());
            log.warn("VNPay IPN: thanh toán chưa thành công. orderCode={} responseCode={}",
                    params.getVnp_TxnRef(), params.getVnp_ResponseCode());
        }

        paymentRepository.save(payment);
        return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getByOrderId(Long orderId, Long userId, boolean manager) {
        Payment payment = paymentRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new BadRequestException(
                        "Không tìm thấy payment cho orderId: " + orderId));
        if (!manager && (userId == null || payment.getOrder().getCustomer() == null
                || !payment.getOrder().getCustomer().getCustomerId().equals(userId))) {
            throw new AccessDeniedException("Bạn không có quyền xem giao dịch này");
        }
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getGuestPayment(GuestPaymentRequest request) {
        Order order = verifyGuestOrder(request);
        Payment payment = paymentRepository.findByOrder_OrderId(order.getOrderId())
                .orElseThrow(() -> new BadRequestException(
                        "Chưa có giao dịch thanh toán cho đơn hàng này"));
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse queryTransaction(Long orderId, String clientIp) {
        Payment payment = paymentRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new BadRequestException(
                        "Không tìm thấy payment: orderId=" + orderId));

        Order order = payment.getOrder();

        Map<String, String> params = vnpayUtil.buildQueryTransactionParams(
                order.getOrderCode(),
                order.getOrderDate().format(VNPAY_FMT),
                clientIp
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.exchange(
                    vnpayConfig.getApiUrl(),
                    HttpMethod.POST,
                    new HttpEntity<>(params, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String responseCode = root.path("vnp_ResponseCode").asText();
            String txnStatus    = root.path("vnp_TransactionStatus").asText();

            if ("00".equals(responseCode) && "00".equals(txnStatus)) {
                payment.setPaymentStatus(PaymentStatus.PAID);
                payment.setTransactionCode(root.path("vnp_TransactionNo").asText());
                payment.setBankCode(root.path("vnp_BankCode").asText());
                payment.setPaidAt(parseVnpayDate(root.path("vnp_PayDate").asText()));
                paymentRepository.save(payment);
                orderService.confirmPaidOnlineOrder(order.getOrderId());

                log.info("Query VNPay: đồng bộ thành công orderId={}", orderId);
            }

        } catch (Exception e) {
            log.error("Query VNPay thất bại: orderId={}", orderId, e);
        }

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean refundPayment(Long orderId, java.math.BigDecimal refundAmount, String clientIp, String createBy) {
        if (refundAmount == null || refundAmount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền hoàn phải lớn hơn 0");
        }

        Payment payment = paymentRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin thanh toán cho đơn hàng: orderId=" + orderId));

        if (payment.getPaymentMethod() != PaymentMethod.VNPAY) {
            throw new BadRequestException("Đơn hàng không thanh toán qua cổng VNPay");
        }

        if (payment.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Chỉ hoàn tiền cho các giao dịch đã thanh toán thành công");
        }

        java.math.BigDecimal refunded = payment.getRefundedAmount() != null
                ? payment.getRefundedAmount()
                : java.math.BigDecimal.ZERO;
        java.math.BigDecimal remaining = payment.getAmount().subtract(refunded);
        if (refundAmount.compareTo(remaining) > 0) {
            throw new BadRequestException("Số tiền hoàn vượt quá số tiền còn có thể hoàn: " + remaining);
        }

        Order order = payment.getOrder();
        String txnDate = payment.getPaidAt() != null
                ? payment.getPaidAt().format(VNPAY_FMT)
                : order.getOrderDate().format(VNPAY_FMT);

        String txnType = (refundAmount.compareTo(payment.getAmount()) >= 0) ? "02" : "03";

        Map<String, String> params = vnpayUtil.buildRefundParams(
                order.getOrderCode(),
                refundAmount.longValue(),
                txnType,
                payment.getTransactionCode(),
                txnDate,
                createBy != null ? createBy : "System",
                clientIp != null ? clientIp : "127.0.0.1",
                "Hoan tien don hang: " + order.getOrderCode()
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.exchange(
                    vnpayConfig.getApiUrl(),
                    HttpMethod.POST,
                    new HttpEntity<>(params, headers),
                    String.class
            );

            log.info("VNPay Refund Response: {}", response.getBody());
            JsonNode root = objectMapper.readTree(response.getBody());
            String responseCode = root.path("vnp_ResponseCode").asText();

            if ("00".equals(responseCode)) {
                java.math.BigDecimal newRefundedAmount = refunded.add(refundAmount);
                payment.setRefundedAmount(newRefundedAmount);
                if (newRefundedAmount.compareTo(payment.getAmount()) >= 0) {
                    payment.setPaymentStatus(PaymentStatus.REFUNDED);
                }
                paymentRepository.save(payment);
                log.info("VNPay Refund success for orderCode={}, refundAmount={}", order.getOrderCode(), refundAmount);
                return true;
            } else {
                String message = getVnpayRefundMessage(responseCode);
                log.error("VNPay Refund failed for orderCode={}, responseCode={}, message={}", order.getOrderCode(), responseCode, message);
                throw new BadRequestException("VNPay từ chối hoàn tiền: Mã lỗi " + responseCode + " - " + message);
            }

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Gửi yêu cầu hoàn tiền VNPay thất bại: orderId={}", orderId, e);
            throw new BadRequestException("Không thể kết nối VNPay. Vui lòng thử lại sau.");
        }
    }

    private String getVnpayRefundMessage(String responseCode) {
        switch (responseCode) {
            case "02": return "Mã TMNCode không hợp lệ";
            case "03": return "Dữ liệu gửi sang không đúng định dạng";
            case "91": return "Không tìm thấy giao dịch yêu cầu hoàn tiền trên hệ thống VNPay Sandbox (Giao dịch giả lập hoặc chưa thanh toán thực tế)";
            case "93": return "Số tiền hoàn không hợp lệ (Số tiền hoàn lớn hơn số tiền thanh toán thực tế)";
            case "94": return "Yêu cầu hoàn tiền bị trùng lặp hoặc đang trong quá trình xử lý";
            case "95": return "Giao dịch gốc thanh toán không thành công, không thể hoàn tiền";
            case "97": return "Chữ ký bảo mật không hợp lệ (Sai checksum)";
            case "99": return "Các lỗi khác hệ thống cổng thanh toán VNPay đang bận hoặc bảo trì";
            default: return "Lỗi không xác định từ VNPay";
        }
    }

    private LocalDateTime parseVnpayDate(String vnpayDate) {
        if (vnpayDate == null || vnpayDate.isBlank()) return LocalDateTime.now();
        try {
            return LocalDateTime.parse(vnpayDate, VNPAY_FMT);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }

    private void validateCallbackAmount(VNPayCallbackParams params, Payment payment) {
        if (params.getVnp_Amount() == null) {
            throw new BadRequestException("VNPay không trả về số tiền giao dịch");
        }
        try {
            long actualAmount = Long.parseLong(params.getVnp_Amount());
            long expectedAmount = payment.getAmount().movePointRight(2).longValueExact();
            if (actualAmount != expectedAmount) {
                throw new BadRequestException("Số tiền VNPay không khớp với đơn hàng");
            }
        } catch (NumberFormatException | ArithmeticException ex) {
            throw new BadRequestException("Số tiền VNPay không hợp lệ");
        }
    }
}
