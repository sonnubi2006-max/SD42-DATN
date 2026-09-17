package com.base.service.helper;

import com.base.entity.Order;
import com.base.entity.OrderTransactionLog;
import com.base.enums.OrderStatus;
import com.base.exception.BadRequestException;
import com.base.repository.OrderTransactionLogRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class ReturnPolicyTest {

    private final OrderTransactionLogRepository logRepository =
            mock(OrderTransactionLogRepository.class);
    private final ReturnPolicy returnPolicy = new ReturnPolicy(logRepository);

    @Test
    void evaluate_shouldUseFirstRealCompletedTransition() {
        Order order = order(10L);
        LocalDateTime completedAt = LocalDateTime.now().minusDays(2);

        OrderTransactionLog completion = log(
                OrderStatus.SHIPPING, OrderStatus.COMPLETED, completedAt);
        OrderTransactionLog partialReturn = log(
                OrderStatus.COMPLETED, OrderStatus.COMPLETED, completedAt.plusDays(1));
        when(logRepository.findByOrder_OrderIdOrderByCreatedAtAsc(10L))
                .thenReturn(List.of(completion, partialReturn));

        ReturnPolicy.ReturnWindow window = returnPolicy.evaluate(order);

        assertEquals(completedAt, window.completedAt());
        assertEquals(completedAt.plusDays(7), window.deadline());
        assertFalse(window.expired());
    }

    @Test
    void evaluate_shouldPreferStoredCompletedAt() {
        Order order = order(10L);
        LocalDateTime completedAt = LocalDateTime.now().minusDays(1);
        order.setCompletedAt(completedAt);

        ReturnPolicy.ReturnWindow window = returnPolicy.evaluate(order);

        assertEquals(completedAt, window.completedAt());
        verify(logRepository, never()).findByOrder_OrderIdOrderByCreatedAtAsc(10L);
    }

    @Test
    void validateReturnWindow_shouldAllowOrderWithinSevenDays() {
        Order order = order(10L);
        when(logRepository.findByOrder_OrderIdOrderByCreatedAtAsc(10L))
                .thenReturn(List.of(log(
                        OrderStatus.SHIPPING,
                        OrderStatus.COMPLETED,
                        LocalDateTime.now().minusDays(6)
                )));

        assertDoesNotThrow(() -> returnPolicy.validateReturnWindow(order));
    }

    @Test
    void validateReturnWindow_shouldRejectOrderAfterSevenDays() {
        Order order = order(10L);
        when(logRepository.findByOrder_OrderIdOrderByCreatedAtAsc(10L))
                .thenReturn(List.of(log(
                        OrderStatus.SHIPPING,
                        OrderStatus.COMPLETED,
                        LocalDateTime.now().minusDays(8)
                )));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> returnPolicy.validateReturnWindow(order)
        );

        assertTrue(exception.getMessage().contains("quá thời hạn đổi hàng 7 ngày"));
    }

    private Order order(Long id) {
        Order order = new Order();
        order.setOrderId(id);
        order.setOrderStatus(OrderStatus.COMPLETED);
        return order;
    }

    private OrderTransactionLog log(
            OrderStatus previousStatus,
            OrderStatus currentStatus,
            LocalDateTime createdAt
    ) {
        OrderTransactionLog log = new OrderTransactionLog();
        log.setPreviousStatus(previousStatus);
        log.setCurrentStatus(currentStatus);
        log.setCreatedAt(createdAt);
        return log;
    }
}
