package com.base.repository;

import com.base.entity.OrderTransactionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderTransactionLogRepository extends JpaRepository<OrderTransactionLog, Long> {
    List<OrderTransactionLog> findByOrder_OrderIdOrderByCreatedAtAsc(Long orderId);
}
