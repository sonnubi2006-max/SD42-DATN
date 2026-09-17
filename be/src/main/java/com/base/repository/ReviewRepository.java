package com.base.repository;

import com.base.entity.Review;
import com.base.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface ReviewRepository
        extends JpaRepository<Review, Long> {

    interface TopRatedProductStatistic {
        Long getProductId();
        String getProductName();
        Double getAverageRating();
        Long getReviewCount();
    }

    @Query("""
            SELECT r.product.productId AS productId,
                   r.product.productName AS productName,
                   AVG(r.rating) AS averageRating,
                   COUNT(r) AS reviewCount
            FROM Review r
            WHERE r.status = com.base.enums.ReviewStatus.APPROVED
              AND r.product.status = com.base.enums.ProductStatus.ACTIVE
              AND (:fromDate IS NULL OR r.createdAt >= :fromDate)
              AND (:toDate IS NULL OR r.createdAt <= :toDate)
            GROUP BY r.product.productId, r.product.productName
            ORDER BY AVG(r.rating) DESC, COUNT(r) DESC, r.product.productName ASC
            """)
    List<TopRatedProductStatistic> findTopRatedProductStatistics(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    Page<Review> findByProduct_ProductIdAndStatus(
            Long productId,
            ReviewStatus status,
            Pageable pageable
    );

    Page<Review> findByProduct_ProductIdAndStatusAndRating(
            Long productId,
            ReviewStatus status,
            Integer rating,
            Pageable pageable
    );

    boolean existsByOrderDetail_OrderDetailId(
            Long orderDetailId
    );

    @Query("SELECT r FROM Review r WHERE r.customer.customerId = :userId AND r.status <> com.base.enums.ReviewStatus.DELETED")
    Page<Review> findActiveReviewsByCustomerId(
            @Param("userId") Long userId,
            Pageable pageable
    );

    @Query("""
            SELECT AVG(r.rating)
            FROM Review r
            WHERE r.product.productId = :productId
            AND r.status = 'APPROVED'
            """)
    Double calculateAverageRating(
            @Param("productId") Long productId
    );

    @Query("""
            SELECT COUNT(r)
            FROM Review r
            WHERE r.product.productId = :productId
            AND r.status = 'APPROVED'
            """)
    Long countApprovedByProductId(
            @Param("productId") Long productId
    );

    @Query("""
            SELECT COUNT(r)
            FROM Review r
            WHERE r.product.productId = :productId
            AND r.status = 'APPROVED'
            AND r.rating = :rating
            """)
    Long countByProductIdAndRating(
            @Param("productId") Long productId,
            @Param("rating") Integer rating
    );

    @org.springframework.data.jpa.repository.Query("""
            SELECT r FROM Review r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:rating IS NULL OR r.rating = :rating)
              AND (:fromDate IS NULL OR r.createdAt >= :fromDate)
              AND (:toDateExclusive IS NULL OR r.createdAt < :toDateExclusive)
              AND (:keyword IS NULL
                   OR LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.customer.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.product.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.product.productCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.variant.variantCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Review> filterReviews(
            @org.springframework.data.repository.query.Param("status") ReviewStatus status,
            @org.springframework.data.repository.query.Param("rating") Integer rating,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("fromDate") LocalDateTime fromDate,
            @org.springframework.data.repository.query.Param("toDateExclusive") LocalDateTime toDateExclusive,
            Pageable pageable
    );
}
