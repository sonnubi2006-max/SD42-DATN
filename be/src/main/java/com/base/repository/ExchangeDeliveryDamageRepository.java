package com.base.repository;

import com.base.entity.ExchangeDeliveryDamage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExchangeDeliveryDamageRepository
        extends JpaRepository<ExchangeDeliveryDamage, Long> {

    interface VariantDamageTotal {
        Long getVariantId();
        Long getDamagedQuantity();
    }

    @Query("""
            SELECT COALESCE(SUM(d.damagedQuantity), 0)
            FROM ExchangeDeliveryDamage d
            WHERE d.variant.variantId = :variantId
            """)
    Long sumDamagedQuantityByVariantId(@Param("variantId") Long variantId);

    @Query("""
            SELECT d FROM ExchangeDeliveryDamage d
            JOIN FETCH d.exchangeDelivery delivery
            JOIN FETCH delivery.returnRequest rr
            JOIN FETCH rr.order o
            WHERE d.variant.variantId = :variantId
              AND d.damagedQuantity > 0
            ORDER BY d.createdAt DESC
            """)
    List<ExchangeDeliveryDamage> findByVariantIdWithDelivery(
            @Param("variantId") Long variantId
    );

    @Query("""
            SELECT d.variant.variantId AS variantId,
                   SUM(d.damagedQuantity) AS damagedQuantity
            FROM ExchangeDeliveryDamage d
            WHERE d.variant.product.productId = :productId
              AND d.damagedQuantity > 0
            GROUP BY d.variant.variantId
            """)
    List<VariantDamageTotal> findDamageTotalsByProductId(
            @Param("productId") Long productId
    );
}
