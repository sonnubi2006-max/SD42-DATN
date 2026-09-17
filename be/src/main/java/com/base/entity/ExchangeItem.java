package com.base.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "exchange_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exchange_item_id")
    private Long exchangeItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false)
    private ReturnRequest returnRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_variant_id")
    private ProductVariant sourceVariant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_variant_id", nullable = false)
    private ProductVariant newVariant;

    @Column(name = "new_product_name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String newProductName;

    @Column(name = "new_color", columnDefinition = "NVARCHAR(25)")
    private String newColor;

    @Column(name = "new_size", columnDefinition = "NVARCHAR(25)")
    private String newSize;

    @Column(name = "new_quantity", nullable = false)
    private Integer newQuantity;

    @Column(name = "price_difference", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal priceDifference = BigDecimal.ZERO;
}
