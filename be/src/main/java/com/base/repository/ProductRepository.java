package com.base.repository;

import com.base.entity.Product;
import com.base.enums.ProductStatus;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    interface ProductSalesStatistic {
        Long getProductId();
        String getProductName();
        Long getQuantity();
        BigDecimal getRevenue();
    }

    @Query(value = """
            SELECT p.product_id AS productId,
                   p.product_name AS productName,
                   COALESCE(SUM(CASE WHEN o.order_status IN ('COMPLETED', 'REFUNDED', 'CANCELED_BY_DAMAGED')
                                      AND (:fromDate IS NULL OR o.completed_at >= :fromDate)
                                      AND (:toDate IS NULL OR o.completed_at <= :toDate)
                                     THEN od.quantity ELSE 0 END), 0) AS quantity,
                   COALESCE(SUM(CASE WHEN o.order_status IN ('COMPLETED', 'REFUNDED', 'CANCELED_BY_DAMAGED')
                                      AND (:fromDate IS NULL OR o.completed_at >= :fromDate)
                                      AND (:toDate IS NULL OR o.completed_at <= :toDate)
                                     THEN od.subtotal ELSE 0 END), 0) AS revenue
            FROM products p
            LEFT JOIN product_variants pv ON pv.product_id = p.product_id
            LEFT JOIN order_details od ON od.variant_id = pv.variant_id
            LEFT JOIN orders o ON o.order_id = od.order_id
            WHERE p.status = 'ACTIVE'
            GROUP BY p.product_id, p.product_name
            ORDER BY revenue DESC
            """, nativeQuery = true)
    List<ProductSalesStatistic> findAllProductSalesStatistics(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    boolean existsByCategory_CategoryId(Long categoryId);

    boolean existsByBrand_BrandId(Long brandId);

    @Query("""
        SELECT p FROM Product p
        WHERE (:keyword IS NULL OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL OR p.category.categoryId = :categoryId)
          AND (:brandId IS NULL OR p.brand.brandId = :brandId)
          AND (:status IS NULL OR p.status = :status)
    """)
    Page<Product> search(
        @Param("keyword") String keyword,
        @Param("categoryId") Long categoryId,
        @Param("brandId") Long brandId,
        @Param("status") ProductStatus status,
        Pageable pageable
    );

    @Query(
            value = """
        SELECT p FROM Product p
        WHERE (:categoryId IS NULL OR p.category.categoryId = :categoryId)
        AND (:brandId IS NULL OR p.brand.brandId = :brandId)
        AND (:status IS NULL OR p.status = :status)
        AND (
            :keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (:minPrice IS NULL AND :maxPrice IS NULL OR EXISTS (
            SELECT 1 FROM ProductVariant v
            WHERE v.product = p
            AND (:minPrice IS NULL OR v.price >= :minPrice)
            AND (:maxPrice IS NULL OR v.price <= :maxPrice)
        ))
    """,
            countQuery = """
        SELECT COUNT(p) FROM Product p
        WHERE (:categoryId IS NULL OR p.category.categoryId = :categoryId)
        AND (:brandId IS NULL OR p.brand.brandId = :brandId)
        AND (:status IS NULL OR p.status = :status)
        AND (
            :keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (:minPrice IS NULL AND :maxPrice IS NULL OR EXISTS (
            SELECT 1 FROM ProductVariant v
            WHERE v.product = p
            AND (:minPrice IS NULL OR v.price >= :minPrice)
            AND (:maxPrice IS NULL OR v.price <= :maxPrice)
        ))
    """
    )
    Page<Product> filterProducts(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("status") ProductStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query(
            value = """
        SELECT p FROM Product p
        WHERE (:categoryId IS NULL OR p.category.categoryId = :categoryId)
        AND (:brandId IS NULL OR p.brand.brandId = :brandId)
        AND (:status IS NULL OR p.status = :status)
        AND (
            :keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (:minPrice IS NULL AND :maxPrice IS NULL OR EXISTS (
            SELECT 1 FROM ProductVariant v
            WHERE v.product = p
            AND (:minPrice IS NULL OR v.price >= :minPrice)
            AND (:maxPrice IS NULL OR v.price <= :maxPrice)
        ))
        ORDER BY (SELECT MIN(v2.price) FROM ProductVariant v2 WHERE v2.product = p) ASC
    """,
            countQuery = """
        SELECT COUNT(p) FROM Product p
        WHERE (:categoryId IS NULL OR p.category.categoryId = :categoryId)
        AND (:brandId IS NULL OR p.brand.brandId = :brandId)
        AND (:status IS NULL OR p.status = :status)
        AND (
            :keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (:minPrice IS NULL AND :maxPrice IS NULL OR EXISTS (
            SELECT 1 FROM ProductVariant v
            WHERE v.product = p
            AND (:minPrice IS NULL OR v.price >= :minPrice)
            AND (:maxPrice IS NULL OR v.price <= :maxPrice)
        ))
    """
    )
    Page<Product> filterProductsOrderByPriceAsc(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("status") ProductStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query(
            value = """
        SELECT p FROM Product p
        WHERE (:categoryId IS NULL OR p.category.categoryId = :categoryId)
        AND (:brandId IS NULL OR p.brand.brandId = :brandId)
        AND (:status IS NULL OR p.status = :status)
        AND (
            :keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (:minPrice IS NULL AND :maxPrice IS NULL OR EXISTS (
            SELECT 1 FROM ProductVariant v
            WHERE v.product = p
            AND (:minPrice IS NULL OR v.price >= :minPrice)
            AND (:maxPrice IS NULL OR v.price <= :maxPrice)
        ))
        ORDER BY (SELECT MAX(v2.price) FROM ProductVariant v2 WHERE v2.product = p) DESC
    """,
            countQuery = """
        SELECT COUNT(p) FROM Product p
        WHERE (:categoryId IS NULL OR p.category.categoryId = :categoryId)
        AND (:brandId IS NULL OR p.brand.brandId = :brandId)
        AND (:status IS NULL OR p.status = :status)
        AND (
            :keyword IS NULL
            OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (:minPrice IS NULL AND :maxPrice IS NULL OR EXISTS (
            SELECT 1 FROM ProductVariant v
            WHERE v.product = p
            AND (:minPrice IS NULL OR v.price >= :minPrice)
            AND (:maxPrice IS NULL OR v.price <= :maxPrice)
        ))
    """
    )
    Page<Product> filterProductsOrderByPriceDesc(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("status") ProductStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    boolean existsByProductName(String productName);

    boolean existsByProductSlug(String productSlug);

    boolean existsByProductCode(String productCode);

    Page<Product> findAllByStatus(ProductStatus status, Pageable pageable);

    @Query("""
        SELECT p 
        FROM Product p
        WHERE p.status = com.base.enums.ProductStatus.ACTIVE
        ORDER BY p.averageRating DESC
    """)
    List<Product> findTop10HighestRatedProducts(Pageable pageable);

    @Query("""
        SELECT p 
        FROM Product p
        LEFT JOIN p.variants v
        LEFT JOIN OrderDetail od ON od.variant = v AND od.order.orderStatus = 'COMPLETED'
        WHERE p.status = com.base.enums.ProductStatus.ACTIVE
        GROUP BY p
        ORDER BY COALESCE(SUM(od.quantity), 0) DESC
    """)
    List<Product> findTopSellingProducts(Pageable pageable);

    Optional<Product> findByProductIdAndStatus(Long id, ProductStatus productStatus);

    Optional<Product> findByProductCodeAndStatus(String productCode, ProductStatus productStatus);

    @Query("SELECT p FROM Product p WHERE " +
            "(:categoryId IS NULL OR p.category.categoryId = :categoryId) AND " +
            "(:brandId IS NULL OR p.brand.brandId = :brandId) AND " +
            "(:minPrice IS NULL OR p.variants IS EMPTY OR EXISTS (SELECT v FROM ProductVariant v WHERE v.product = p AND v.price >= :minPrice)) AND " +
            "(:maxPrice IS NULL OR p.variants IS EMPTY OR EXISTS (SELECT v FROM ProductVariant v WHERE v.product = p AND v.price <= :maxPrice)) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:keyword IS NULL OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            " LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%')))"
    )
    List<Product> filterProductsForExport(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("status") ProductStatus status,
            @Param("keyword") String keyword);

    boolean existsByProductNameAndProductIdNot(String productName, Long id);
    boolean existsByProductSlugAndProductIdNot(String productSlug, Long id);
}
