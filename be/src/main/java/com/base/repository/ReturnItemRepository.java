package com.base.repository;

import com.base.entity.ReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {
    interface VariantDamageTotal {
        Long getVariantId();
        Long getDamagedQuantity();
    }
    @Query("""
            SELECT COALESCE(SUM(ri.damagedQuantity), 0)
            FROM ReturnItem ri
            WHERE ri.variant.variantId = :variantId
              AND ri.returnRequest.status = com.base.enums.ReturnStatus.COMPLETED
            """)
    Long sumCompletedDamagedQuantityByVariantId(@Param("variantId") Long variantId);

    @Query("""
            SELECT ri FROM ReturnItem ri
            JOIN FETCH ri.returnRequest rr
            JOIN FETCH rr.order o
            WHERE ri.variant.variantId = :variantId
              AND ri.damagedQuantity > 0
              AND rr.status = com.base.enums.ReturnStatus.COMPLETED
            ORDER BY rr.updatedAt DESC
            """)
    List<ReturnItem> findCompletedDamagedByVariantId(@Param("variantId") Long variantId);

    @Query("""
            SELECT ri.variant.variantId AS variantId, SUM(ri.damagedQuantity) AS damagedQuantity
            FROM ReturnItem ri
            WHERE ri.variant.product.productId = :productId
              AND ri.damagedQuantity > 0
              AND ri.returnRequest.status = com.base.enums.ReturnStatus.COMPLETED
            GROUP BY ri.variant.variantId
            """)
    List<VariantDamageTotal> findCompletedDamageTotalsByProductId(@Param("productId") Long productId);
}
