package com.base.entity;

import com.base.enums.ProductVariantStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "product_variants",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_product_variant",
                        columnNames = {"product_id", "size", "color"}
                )
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "variant_id")
    private Long variantId;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "variant_code", unique = true, nullable = false)
    private String variantCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(unique = true)
    private String barcode;

    @Column(columnDefinition = "NVARCHAR(25)")
    private String size;

    @Column(columnDefinition = "NVARCHAR(25)")
    private String color;

    @Column(precision = 15, scale = 2)
    private BigDecimal price;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "variant", cascade = CascadeType.ALL)
    private ProductImage image;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProductVariantStatus status = ProductVariantStatus.INACTIVE;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    @Builder.Default
    private Integer reservedQuantity = 0;

    public Integer getAvailableStock() {
        return stockQuantity;
    }

    public boolean isAvailable() {
        return getAvailableStock() > 0;
    }
}
