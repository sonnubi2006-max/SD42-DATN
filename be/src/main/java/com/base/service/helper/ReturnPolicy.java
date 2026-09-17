package com.base.service.helper;

import com.base.entity.Order;
import com.base.entity.OrderTransactionLog;
import com.base.enums.OrderStatus;
import com.base.exception.BadRequestException;
import com.base.repository.OrderTransactionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReturnPolicy {

    public static final int RETURN_WINDOW_DAYS = 7;
    private static final DateTimeFormatter DEADLINE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final OrderTransactionLogRepository orderTransactionLogRepository;

    public ReturnWindow evaluate(Order order) {
        LocalDateTime completedAt = resolveCompletedAt(order);
        LocalDateTime deadline = completedAt != null
                ? completedAt.plusDays(RETURN_WINDOW_DAYS)
                : null;
        boolean expired = deadline == null || LocalDateTime.now().isAfter(deadline);
        return new ReturnWindow(completedAt, deadline, expired);
    }

    public void validateReturnWindow(Order order) {
        ReturnWindow window = evaluate(order);
        if (window.deadline() == null) {
            throw new BadRequestException(
                    "Không xác định được thời điểm hoàn thành đơn hàng để tính hạn đổi hàng");
        }
        if (window.expired()) {
            throw new BadRequestException(
                    "Đã quá thời hạn đổi hàng 7 ngày. Hạn cuối: "
                            + window.deadline().format(DEADLINE_FORMAT));
        }
    }

    private LocalDateTime resolveCompletedAt(Order order) {
        if (order == null) {
            return null;
        }

        if (order.getCompletedAt() != null) {
            return order.getCompletedAt();
        }

        if (order.getOrderId() != null) {
            List<OrderTransactionLog> logs =
                    orderTransactionLogRepository.findByOrder_OrderIdOrderByCreatedAtAsc(
                            order.getOrderId());
            LocalDateTime transitionTime = logs.stream()
                    .filter(log -> log.getCurrentStatus() == OrderStatus.COMPLETED)
                    .filter(log -> log.getPreviousStatus() != OrderStatus.COMPLETED)
                    .map(OrderTransactionLog::getCreatedAt)
                    .filter(java.util.Objects::nonNull)
                    .findFirst()
                    .orElse(null);
            if (transitionTime != null) {
                return transitionTime;
            }
        }

        if (order.getUpdatedAt() != null) {
            return order.getUpdatedAt();
        }
        if (order.getOrderDate() != null) {
            return order.getOrderDate();
        }
        return order.getCreatedAt();
    }

    public record ReturnWindow(
            LocalDateTime completedAt,
            LocalDateTime deadline,
            boolean expired
    ) {
    }
}
