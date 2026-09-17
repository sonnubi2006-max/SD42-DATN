package com.base.repository;

import com.base.dto.response.category.CategoryStatisticProjection;
import com.base.entity.Category;
import com.base.enums.CategoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCategoryName(String categoryName);
    boolean existsByCategoryName(String categoryName);
    boolean existsByCategoryNameAndCategoryIdNot(String categoryName, Long categoryId);
    boolean existsByCategoryCode(String categoryCode);
    boolean existsByCategoryCodeAndCategoryIdNot(String categoryCode, Long categoryId);

    @Query("""
    SELECT c
    FROM Category c
    WHERE (:status IS NULL OR c.categoryStatus = :status)
      AND (:keyword IS NULL 
          OR LOWER(c.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR LOWER(c.categoryCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
      )
""")
    Page<Category> findCategories(
            @Param("status") CategoryStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
    SELECT
        COUNT(c) as totalCategories,
        COALESCE(
            SUM(
                CASE
                    WHEN c.categoryStatus = com.base.enums.CategoryStatus.ACTIVE
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as activeCategories,
        COALESCE(
            SUM(
                CASE
                    WHEN c.categoryStatus = com.base.enums.CategoryStatus.INACTIVE
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as inactiveCategories
    FROM Category c
""")
    CategoryStatisticProjection getCategoryStatistics();
}
