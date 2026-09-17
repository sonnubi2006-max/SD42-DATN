package com.base.repository;

import com.base.entity.Coupon;
import com.base.enums.CouponStatus;
import com.base.enums.CouponType;
import com.base.enums.DiscountType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
        SELECT c FROM Coupon c
        WHERE (:keyword IS NULL OR
                  LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                  LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:isStatusFiltered = false OR
               (:isInactiveFilter = true AND c.status = com.base.enums.CouponStatus.INACTIVE) OR
               (:isUpcomingFilter = true AND c.status != com.base.enums.CouponStatus.INACTIVE AND c.startDate IS NOT NULL AND :now < c.startDate) OR
               (:isActiveFilter = true AND c.status != com.base.enums.CouponStatus.INACTIVE AND (c.startDate IS NULL OR :now >= c.startDate) AND (c.endDate IS NULL OR :now <= c.endDate) AND (c.totalQuantity IS NULL OR c.usedQuantity < c.totalQuantity)) OR
               (:isExpiredFilter = true AND (c.status = com.base.enums.CouponStatus.EXPIRED OR (c.status != com.base.enums.CouponStatus.INACTIVE AND ((c.endDate IS NOT NULL AND :now > c.endDate) OR (c.totalQuantity IS NOT NULL AND c.usedQuantity >= c.totalQuantity))))))
          AND (:type IS NULL OR c.couponType = :type)
          AND (:discountType IS NULL OR c.discountType = :discountType)
          AND (:startDate IS NULL OR c.startDate >= :startDate)
          AND (:endDate IS NULL OR c.endDate <= :endDate)
        """)
    Page<Coupon> filterCoupons(
            @Param("keyword") String keyword,
            @Param("isStatusFiltered") boolean isStatusFiltered,
            @Param("isInactiveFilter") boolean isInactiveFilter,
            @Param("isUpcomingFilter") boolean isUpcomingFilter,
            @Param("isActiveFilter") boolean isActiveFilter,
            @Param("isExpiredFilter") boolean isExpiredFilter,
            @Param("type") CouponType type,
            @Param("discountType") DiscountType discountType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );

    @Query("""
            SELECT CASE WHEN COUNT(cu) > 0 THEN true ELSE false END
            FROM Coupon c JOIN c.targetedCustomers cu
            WHERE c.couponId = :couponId AND cu.customerId = :customerId
            """)
    boolean isCustomerEligible(@Param("couponId") Long couponId,
                               @Param("customerId") Long customerId);

    List<Coupon> findByStatusNot(CouponStatus status);

    @Query("""
            SELECT c FROM Coupon c JOIN c.targetedCustomers cu
            WHERE cu.customerId = :customerId
              AND c.status = com.base.enums.CouponStatus.ACTIVE
              AND c.couponType = com.base.enums.CouponType.PERSONAL
            """)
    List<Coupon> findPersonalCouponsForCustomer(@Param("customerId") Long customerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Coupon c
            SET c.usedQuantity = c.usedQuantity + 1
            WHERE c.couponId = :id
              AND (c.totalQuantity IS NULL OR c.usedQuantity < c.totalQuantity)
            """)
    int incrementUsedQuantity(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Coupon c SET c.usedQuantity = c.usedQuantity - 1 WHERE c.couponId = :id AND c.usedQuantity > 0")
    void decrementUsedQuantity(@Param("id") Long id);
}
