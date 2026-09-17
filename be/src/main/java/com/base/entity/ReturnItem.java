package com.base.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "return_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_item_id")
    private Long returnItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false)
    private ReturnRequest returnRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String productName;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String sku;

    @Column(columnDefinition = "NVARCHAR(25)")
    private String color;

    @Column(columnDefinition = "NVARCHAR(25)")
    private String size;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "damaged_quantity")
    @Builder.Default
    private Integer damagedQuantity = 0;

    @Column(name = "original_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal originalPrice;

    @Column(name = "refund_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal refundPrice;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String reason;
}
