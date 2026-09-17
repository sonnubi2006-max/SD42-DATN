package com.base.repository;

import com.base.entity.Product;
import com.base.entity.ProductVariant;
import com.base.enums.ProductStatus;
import com.base.enums.ProductVariantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    Optional<ProductVariant> findByVariantCode(String variantCode);
    boolean existsByVariantCode(String variantCode);

    Optional<ProductVariant> findByBarcode(String barcode);

    boolean existsByBarcode(String barcode);

    List<ProductVariant> findByProduct_ProductId(Long productId);

    boolean existsByProduct_ProductIdAndSizeIgnoreCaseAndColorIgnoreCase(
            Long productId, String size, String color);

    @Query("""
            SELECT v FROM ProductVariant v
            JOIN FETCH v.product p
            JOIN FETCH p.category
            LEFT JOIN FETCH v.image
            WHERE v.variantId = :variantId
            """)
    Optional<ProductVariant> findByIdWithAll(@Param("variantId") Long variantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT v FROM ProductVariant v
            JOIN FETCH v.product p
            LEFT JOIN FETCH p.category
            LEFT JOIN FETCH v.image
            WHERE v.variantId = :variantId
            """)
    Optional<ProductVariant> findByIdForUpdate(@Param("variantId") Long variantId);

    Optional<ProductVariant> findByVariantIdAndStatusAndProduct_Status(Long variantId, ProductVariantStatus status, ProductStatus productStatus);

    @Query("""
            SELECT v FROM ProductVariant v
            WHERE (:productId IS NULL OR v.product.productId = :productId)
            AND (:status IS NULL OR v.status = :status)
            AND (
                :keyword IS NULL
                OR LOWER(v.size) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(v.color) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(v.barcode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(v.variantCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            AND (:minPrice IS NULL OR v.price >= :minPrice)
            AND (:maxPrice IS NULL OR v.price <= :maxPrice)
            """)
    Page<ProductVariant> filterProductVariants(
            @Param("productId") Long productId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("status") ProductVariantStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
            SELECT MIN(v.price), MAX(v.price)
            FROM ProductVariant v
            WHERE v.product.status = com.base.enums.ProductStatus.ACTIVE
            AND v.status = com.base.enums.ProductVariantStatus.ACTIVE
            """)
    List<Object[]> getActivePriceRange();

    @Query("""
            SELECT v FROM ProductVariant v
            JOIN FETCH v.product p
            WHERE v.status = com.base.enums.ProductVariantStatus.ACTIVE
            AND p.status = com.base.enums.ProductStatus.ACTIVE
            """)
    List<ProductVariant> findAllActiveWithProduct();
}
