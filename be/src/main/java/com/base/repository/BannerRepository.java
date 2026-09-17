package com.base.repository;

import com.base.dto.response.banner.BannerStatisticProjection;
import com.base.entity.Banner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {
    Page<Banner> findByIsActiveOrderByCreatedAtDesc(boolean isActive, Pageable pageable);
    @Query("""
    SELECT b
    FROM Banner b
    WHERE (:keyword IS NULL OR
           LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
      AND (:isActive IS NULL OR b.isActive = :isActive)
      AND (:checkDate = false OR :checkDate IS NULL OR (
          (b.startDate IS NULL OR b.startDate <= :now) AND
          (b.endDate IS NULL OR b.endDate >= :now)
      ))
""")
    Page<Banner> search(
            @Param("keyword") String keyword,
            @Param("isActive") Boolean isActive,
            @Param("checkDate") Boolean checkDate,
            @Param("now") java.time.LocalDateTime now,
            Pageable pageable);

    @Query("""
    SELECT
        COUNT(b) as totalBanners,
        COALESCE(
            SUM(
                CASE
                    WHEN b.isActive = true
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as activeBanners,
        COALESCE(
            SUM(
                CASE
                    WHEN b.isActive = false
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) as inactiveBanners
    FROM Banner b
""")
    BannerStatisticProjection getBannerStatistics();
}
