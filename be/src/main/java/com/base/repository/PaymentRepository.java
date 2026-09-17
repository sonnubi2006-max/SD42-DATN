package com.base.repository;

import com.base.entity.Payment;
import com.base.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrder_OrderId(Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.order o
            LEFT JOIN FETCH o.customer
            WHERE o.orderId = :orderId
            """)
    Optional<Payment> findByOrderIdForUpdate(@Param("orderId") Long orderId);

    Optional<Payment> findByOrder_OrderCode(String orderCode);

    Optional<Payment> findByTransactionCode(String transactionCode);

    boolean existsByOrder_OrderIdAndPaymentStatus(Long orderId, PaymentStatus status);

    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.order o
            WHERE o.orderCode = :orderCode
            """)
    Optional<Payment> findByOrderCodeWithOrder(@Param("orderCode") String orderCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.order o
            WHERE o.orderCode = :orderCode
            """)
    Optional<Payment> findByOrderCodeWithOrderForUpdate(@Param("orderCode") String orderCode);

    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.order o
            WHERE p.paymentStatus IN ('PENDING', 'FAILED')
              AND o.orderStatus = 'WAITING_PAYMENT'
              AND COALESCE(p.updatedAt, p.createdAt) <= :cutoff
            """)
    List<Payment> findExpiredPendingPayments(@Param("cutoff") LocalDateTime cutoff);
}
