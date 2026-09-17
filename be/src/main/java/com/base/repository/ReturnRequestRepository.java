package com.base.repository;

import com.base.entity.ReturnRequest;
import com.base.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import jakarta.persistence.LockModeType;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    @Query("""
            SELECT rr FROM ReturnRequest rr
            LEFT JOIN rr.customer c
            WHERE (:status IS NULL OR rr.status = :status)
              AND (:keyword IS NULL
                   OR LOWER(rr.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(c.customerCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(rr.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR rr.customerPhone LIKE CONCAT('%', :keyword, '%'))
              AND (:fromDate IS NULL OR rr.createdAt >= :fromDate)
              AND (:toDate IS NULL OR rr.createdAt <= :toDate)
            """)
    Page<ReturnRequest> search(
            @Param("status") ReturnStatus status,
            @Param("keyword") String keyword,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable
    );

    @Query("""
            SELECT rr FROM ReturnRequest rr
            LEFT JOIN FETCH rr.items i
            LEFT JOIN FETCH i.variant v
            LEFT JOIN FETCH rr.order o
            WHERE rr.returnId = :id
            """)
    Optional<ReturnRequest> findByIdWithItems(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT rr FROM ReturnRequest rr
            WHERE rr.returnId = :id
            """)
    Optional<ReturnRequest> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT COALESCE(SUM(i.quantity), 0)
            FROM ReturnItem i
            WHERE i.returnRequest.order.orderId = :orderId
              AND i.variant.variantId = :variantId
              AND i.returnRequest.status <> com.base.enums.ReturnStatus.REJECTED
            """)
    int sumActiveReturnedQuantity(
            @Param("orderId") Long orderId,
            @Param("variantId") Long variantId
    );

    @Query("""
            SELECT COALESCE(SUM(i.quantity), 0)
            FROM ReturnItem i
            WHERE i.returnRequest.order.orderId = :orderId
              AND i.variant.variantId = :variantId
              AND i.returnRequest.status = com.base.enums.ReturnStatus.COMPLETED
            """)
    int sumCompletedReturnedQuantity(
            @Param("orderId") Long orderId,
            @Param("variantId") Long variantId
    );

    @Query("""
            SELECT COALESCE(SUM(rr.refundAmount), 0)
            FROM ReturnRequest rr
            WHERE rr.order.orderId = :orderId
              AND rr.returnType = com.base.enums.ReturnType.REFUND
              AND rr.status <> com.base.enums.ReturnStatus.REJECTED
            """)
    java.math.BigDecimal sumAllocatedRefundAmount(@Param("orderId") Long orderId);

    @Query("""
            SELECT COALESCE(SUM(rr.refundAmount), 0)
            FROM ReturnRequest rr
            WHERE rr.order.orderId = :orderId
              AND rr.returnId <> :returnId
              AND rr.returnType = com.base.enums.ReturnType.REFUND
              AND rr.status <> com.base.enums.ReturnStatus.REJECTED
            """)
    java.math.BigDecimal sumAllocatedRefundAmountExcludingReturn(
            @Param("orderId") Long orderId,
            @Param("returnId") Long returnId
    );

    @Query("""
            SELECT rr FROM ReturnRequest rr
            LEFT JOIN FETCH rr.items i
            LEFT JOIN FETCH i.variant
            LEFT JOIN FETCH rr.processedBy
            WHERE rr.order.orderId = :orderId
              AND rr.status = com.base.enums.ReturnStatus.COMPLETED
            ORDER BY rr.updatedAt DESC
            """)
    List<ReturnRequest> findCompletedByOrderIdWithItems(@Param("orderId") Long orderId);

    @Query("""
            SELECT rr FROM ReturnRequest rr
            JOIN FETCH rr.order o
            WHERE rr.status = com.base.enums.ReturnStatus.COMPLETED
              AND (:fromDate IS NULL OR COALESCE(rr.updatedAt, rr.createdAt) >= :fromDate)
              AND (:toDate IS NULL OR COALESCE(rr.updatedAt, rr.createdAt) <= :toDate)
            ORDER BY COALESCE(rr.updatedAt, rr.createdAt) ASC
            """)
    List<ReturnRequest> findCompletedForStatistics(
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate
    );

    @Query("""
            SELECT rr FROM ReturnRequest rr
            WHERE rr.customer.customerId = :customerId
            """)
    Page<ReturnRequest> findByCustomerId(@Param("customerId") Long customerId, Pageable pageable);
}
