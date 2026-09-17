package com.base.repository;

import com.base.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {

    interface ProductSalesStatistic {
        String getProductName();
        Long getQuantity();
        BigDecimal getRevenue();
    }

    interface VariantDamageTotal {
        Long getVariantId();
        Long getDamagedQuantity();
    }

    @Query("""
            SELECT od.productName AS productName,
                   SUM(od.quantity) AS quantity,
                   SUM(od.subtotal) AS revenue
            FROM OrderDetail od
            JOIN od.order o
            WHERE o.orderStatus IN (
                com.base.enums.OrderStatus.COMPLETED,
                com.base.enums.OrderStatus.REFUNDED,
                com.base.enums.OrderStatus.CANCELED_BY_DAMAGED
            )
              AND (:fromDate IS NULL OR o.completedAt >= :fromDate)
              AND (:toDate IS NULL OR o.completedAt <= :toDate)
            GROUP BY od.productName
            ORDER BY SUM(od.subtotal) DESC
            """)
    List<ProductSalesStatistic> findProductSalesStatistics(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    @Query("""
            SELECT od
            FROM OrderDetail od
            JOIN FETCH od.order o
            JOIN FETCH od.variant v
            JOIN FETCH v.product p
            WHERE o.customer.customerId = :customerId
              AND o.orderStatus = com.base.enums.OrderStatus.COMPLETED
              AND od.review IS NULL
            ORDER BY o.updatedAt DESC, od.orderDetailId DESC
            """)
    Page<OrderDetail> findUnreviewedCompletedItems(
            @Param("customerId") Long customerId,
            Pageable pageable
    );

    List<OrderDetail> findByOrder_OrderId(Long orderId);

    @Query("""
            SELECT COALESCE(SUM(od.quantity), 0)
            FROM OrderDetail od
            WHERE od.variant.variantId = :variantId
              AND od.order.orderStatus IN ('COMPLETED', 'CANCELED_BY_DAMAGED')
            """)
    Long sumSoldQuantityByVariant(@Param("variantId") Long variantId);

    @Query("""
            SELECT COALESCE(SUM(od.quantity), 0)
            FROM OrderDetail od
            WHERE od.variant.product.productId = :productId
              AND od.order.orderStatus IN ('COMPLETED', 'CANCELED_BY_DAMAGED')
            """)
    Long sumSoldQuantityByProduct(@Param("productId") Long productId);

    @Query("""
            SELECT COALESCE(SUM(od.subtotal), 0)
            FROM OrderDetail od
            WHERE od.variant.variantId = :variantId
              AND od.order.orderStatus IN ('COMPLETED', 'CANCELED_BY_DAMAGED')
            """)
    BigDecimal sumRevenueByVariant(@Param("variantId") Long variantId);

    Optional<OrderDetail> findByOrderDetailIdAfterAndOrder_OrderId(
            Long detailId,
            Long orderId
    );

    @Query("""
            SELECT COALESCE(SUM(od.damagedQuantity), 0)
            FROM OrderDetail od
            WHERE od.variant.variantId = :variantId
            """)
    Long sumDamagedQuantityByVariantId(@Param("variantId") Long variantId);

    @Query("""
            SELECT od FROM OrderDetail od
            JOIN FETCH od.order o
            WHERE od.variant.variantId = :variantId
              AND od.damagedQuantity > 0
            ORDER BY o.updatedAt DESC
            """)
    List<OrderDetail> findDamagedByVariantId(@Param("variantId") Long variantId);

    @Query("""
            SELECT od.variant.variantId AS variantId, SUM(od.damagedQuantity) AS damagedQuantity
            FROM OrderDetail od
            WHERE od.variant.product.productId = :productId AND od.damagedQuantity > 0
            GROUP BY od.variant.variantId
            """)
    List<VariantDamageTotal> findDamageTotalsByProductId(@Param("productId") Long productId);
}
