package com.base.repository;

import com.base.entity.ExchangeDelivery;
import com.base.enums.ExchangeDeliveryStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ExchangeDeliveryRepository extends JpaRepository<ExchangeDelivery, Long> {
    Optional<ExchangeDelivery> findByReturnRequest_ReturnId(Long returnId);

    @Query(value = """
            SELECT d FROM ExchangeDelivery d
            JOIN FETCH d.returnRequest rr
            JOIN FETCH rr.order o
            LEFT JOIN FETCH rr.customer c
            WHERE (:status IS NULL OR d.status = :status)
              AND (:fromDate IS NULL OR d.createdAt >= :fromDate)
              AND (:toDate IS NULL OR d.createdAt <= :toDate)
              AND (:keyword IS NULL OR LOWER(d.deliveryCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(rr.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(c.customerCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(d.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR d.receiverPhone LIKE CONCAT('%', :keyword, '%'))
            """, countQuery = """
            SELECT COUNT(d) FROM ExchangeDelivery d
            JOIN d.returnRequest rr
            LEFT JOIN rr.customer c
            WHERE (:status IS NULL OR d.status = :status)
              AND (:fromDate IS NULL OR d.createdAt >= :fromDate)
              AND (:toDate IS NULL OR d.createdAt <= :toDate)
              AND (:keyword IS NULL OR LOWER(d.deliveryCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(rr.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(c.customerCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(d.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR d.receiverPhone LIKE CONCAT('%', :keyword, '%'))
            """)
    Page<ExchangeDelivery> search(@Param("status") ExchangeDeliveryStatus status,
                                  @Param("keyword") String keyword,
                                  @Param("fromDate") java.time.LocalDateTime fromDate,
                                  @Param("toDate") java.time.LocalDateTime toDate,
                                  Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM ExchangeDelivery d WHERE d.exchangeDeliveryId = :id")
    Optional<ExchangeDelivery> findByIdForUpdate(@Param("id") Long id);
}
