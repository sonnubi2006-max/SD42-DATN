package com.base.repository;

import com.base.entity.Promotion;
import com.base.enums.PromotionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    boolean existsByPromotionCode(String promotionCode);

    @Query("""
            SELECT p FROM Promotion p
            WHERE (:keyword IS NULL
                   OR LOWER(p.promotionCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:isStatusFiltered = false OR 
                   (:isCancelledFilter = true AND p.status = com.base.enums.PromotionStatus.CANCELLED) OR
                   (:isUpcomingFilter = true AND p.status != com.base.enums.PromotionStatus.CANCELLED AND p.startDate IS NOT NULL AND :now < p.startDate) OR
                   (:isActiveFilter = true AND p.status != com.base.enums.PromotionStatus.CANCELLED AND (p.startDate IS NULL OR :now >= p.startDate) AND (p.endDate IS NULL OR :now <= p.endDate)) OR
                   (:isEndedFilter = true AND (p.status = com.base.enums.PromotionStatus.ENDED OR (p.status != com.base.enums.PromotionStatus.CANCELLED AND p.endDate IS NOT NULL AND :now > p.endDate))))
              AND (:applyType IS NULL OR p.applyType = :applyType)
              AND (:startDate IS NULL OR p.startDate >= :startDate)
              AND (:endDate IS NULL OR p.endDate <= :endDate)
            """)
    Page<Promotion> filterPromotions(
            @Param("keyword") String keyword,
            @Param("isStatusFiltered") boolean isStatusFiltered,
            @Param("isCancelledFilter") boolean isCancelledFilter,
            @Param("isUpcomingFilter") boolean isUpcomingFilter,
            @Param("isActiveFilter") boolean isActiveFilter,
            @Param("isEndedFilter") boolean isEndedFilter,
            @Param("applyType") com.base.enums.ApplyType applyType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );

    @Query("""
            SELECT p FROM Promotion p
            LEFT JOIN FETCH p.categories
            LEFT JOIN FETCH p.products
            LEFT JOIN FETCH p.variants
            WHERE p.status = 'ACTIVE'
              AND p.startDate <= :now
              AND p.endDate   >= :now
            """)
    List<Promotion> findActivePromotions(@Param("now") LocalDateTime now);

    @Query("""
            SELECT p
            FROM Promotion p
            LEFT JOIN FETCH p.categories
            LEFT JOIN FETCH p.products pr
            WHERE pr.productId = :productId
              AND p.status = 'ACTIVE'
              AND :now BETWEEN p.startDate AND p.endDate
            ORDER BY p.discountValue DESC
            """)
    Optional<Promotion> findActivePromotionsByProductId(
            @Param("productId") Long productId,
            @Param("now") LocalDateTime now
    );
}
