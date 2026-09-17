package com.base.service.impl;

import com.base.config.VNPayConfig;
import com.base.entity.Order;
import com.base.entity.Payment;
import com.base.enums.PaymentStatus;
import com.base.repository.OrderRepository;
import com.base.repository.PaymentRepository;
import com.base.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentExpirationScheduler {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final VNPayConfig vnpayConfig;

    @Scheduled(fixedDelay = 60_000)
    public void cancelExpiredVnpayOrders() {
        int expireMinutes = vnpayConfig.getExpireMinutes() > 0 ? vnpayConfig.getExpireMinutes() : 10;
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(expireMinutes);

        List<Order> expiredOrders = orderRepository.findExpiredWaitingPaymentOrders(cutoff);

        if (!expiredOrders.isEmpty()) {
            log.info("[PAYMENT] Quét thấy {} đơn hàng quá hạn thanh toán (> {} phút), tiến hành tự động huỷ...",
                    expiredOrders.size(), expireMinutes);

            for (Order order : expiredOrders) {
                try {
                    paymentRepository.findByOrder_OrderId(order.getOrderId()).ifPresent(payment -> {
                        if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                            payment.setPaymentStatus(PaymentStatus.CANCELLED);
                            paymentRepository.save(payment);
                        }
                    });

                    orderService.cancelUnpaidPaymentOrder(
                            order.getOrderId(),
                            "Quá thời gian thanh toán VNPay (" + expireMinutes + " phút)"
                    );
                    log.info("[PAYMENT] Tự huỷ đơn quá hạn thanh toán thành công: {}", order.getOrderCode());
                } catch (Exception ex) {
                    log.error("[PAYMENT] Lỗi khi tự huỷ đơn quá hạn {}: {}", order.getOrderCode(), ex.getMessage(), ex);
                }
            }
        }

        // Quét bổ sung các bản ghi Payment PENDING quá hạn (nếu có)
        try {
            List<Payment> expiredPayments = paymentRepository.findExpiredPendingPayments(cutoff);
            for (Payment payment : expiredPayments) {
                try {
                    payment.setPaymentStatus(PaymentStatus.CANCELLED);
                    paymentRepository.save(payment);
                    if (payment.getOrder() != null) {
                        orderService.cancelUnpaidPaymentOrder(
                                payment.getOrder().getOrderId(),
                                "Quá thời gian thanh toán VNPay (" + expireMinutes + " phút)"
                        );
                        log.info("[PAYMENT] Tự huỷ đơn quá hạn từ bản ghi payment: {}",
                                payment.getOrder().getOrderCode());
                    }
                } catch (Exception ex) {
                    log.error("[PAYMENT] Lỗi khi huỷ đơn từ payment: {}", ex.getMessage(), ex);
                }
            }
        } catch (Exception ex) {
            log.error("[PAYMENT] Lỗi khi quét expired pending payments: {}", ex.getMessage(), ex);
        }
    }
}
