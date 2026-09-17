package com.base.service.impl;

import com.base.entity.Order;
import com.base.enums.OrderStatus;
import com.base.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DraftOrderCleanupScheduler {

    private final OrderRepository orderRepository;

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void deleteAllDraftOrdersAtStartOfDay() {
        List<Order> draftOrders =
                orderRepository.findAllByOrderStatus(OrderStatus.DRAFT);

        if (draftOrders.isEmpty()) {
            log.info("[DRAFT_ORDER_CLEANUP] Không có đơn chờ cần xóa");
            return;
        }

        int deletedCount = draftOrders.size();
        orderRepository.deleteAll(draftOrders);
        orderRepository.flush();

        log.info(
                "[DRAFT_ORDER_CLEANUP] Đã xóa {} đơn chờ khi bắt đầu ngày mới",
                deletedCount
        );
    }
}