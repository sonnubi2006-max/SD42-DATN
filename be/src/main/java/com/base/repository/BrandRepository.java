package com.base.repository;

import com.base.dto.response.brand.BrandStatisticProjection;
import com.base.entity.Brand;
import com.base.entity.Category;
import com.base.enums.BrandStatus;
import com.base.enums.CategoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    Optional<Brand> findByBrandName(String brandName);
    boolean existsByBrandName(String brandName);
    boolean existsByBrandNameAndBrandIdNot(String brandName, Long id);
    boolean existsByBrandCode(String brandCode);
    boolean existsByBrandCodeAndBrandIdNot(String brandCode, Long brandId);

    @Query("""
    SELECT b
    FROM Brand b
    WHERE (:status IS NULL OR b.brandStatus = :status)
      AND (:keyword IS NULL 
        OR LOWER(b.brandName) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(b.brandCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
      )
""")
    Page<Brand> findBrands(
            @Param("status") BrandStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
    SELECT
        COUNT(b) as totalBrands,
        COALESCE(
            SUM(
                CASE
                    WHEN b.brandStatus = com.base.enums.BrandStatus.ACTIVE
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as activeBrands,
        COALESCE(
            SUM(
                CASE
                    WHEN b.brandStatus = com.base.enums.BrandStatus.INACTIVE
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as inactiveBrands
    FROM Brand b
""")
    BrandStatisticProjection getBrandStatistics();
}
