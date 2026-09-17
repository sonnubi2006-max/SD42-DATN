package com.base.repository;

import com.base.dto.response.product.TopWishlistProductProjection;
import com.base.entity.Wishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    Page<Wishlist> findByCustomer_CustomerId(Long userId, Pageable pageable);

    Optional<Wishlist> findByCustomer_CustomerIdAndVariant_VariantId(Long userId, Long variantId);

    boolean existsByCustomer_CustomerIdAndVariant_VariantId(Long userId, Long variantId);

    void deleteByCustomer_CustomerIdAndVariant_VariantId(Long userId, Long variantId);

    long countByCustomerCustomerId(Long userId);

    void deleteAllByCustomer_CustomerId(Long userId);

    @Query("""
    SELECT w
    FROM Wishlist w
    WHERE w.customer.customerId = :userId
    AND (
        :keyword IS NULL
        OR LOWER(w.variant.product.productName)
        LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
""")
    Page<Wishlist> findWishlistByUserAndKeyword(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
    SELECT
        pv.product.productId,
        pv.product.productName,
        COUNT(w)
    FROM Wishlist w
    JOIN w.variant pv
    GROUP BY
        pv.product.productId,
        pv.product.productName
    ORDER BY COUNT(w) DESC
""")
    List<TopWishlistProductProjection> getTopWishlistProducts();
}
