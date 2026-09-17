package com.base.entity;

import com.base.enums.ApplyType;
import com.base.enums.DiscountType;
import com.base.enums.PromotionStatus;
import com.base.utils.BusinessCodeGenerator;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_id")
    private Long promotionId;

    @Column(name = "promotion_code", length = 20)
    private String promotionCode;

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String name;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(name = "discount_value", precision = 15, scale = 2, nullable = false)
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 15, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "apply_type", nullable = false)
    private ApplyType applyType;

    @ManyToMany
    @JoinTable(
            name = "promotion_categories",
            joinColumns = @JoinColumn(name = "promotion_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "promotion_products",
            joinColumns = @JoinColumn(name = "promotion_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    @Builder.Default
    private Set<Product> products = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "promotion_variants",
            joinColumns = @JoinColumn(name = "promotion_id"),
            inverseJoinColumns = @JoinColumn(name = "variant_id")
    )
    @Builder.Default
    private Set<ProductVariant> variants = new HashSet<>();

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PromotionStatus status = PromotionStatus.UPCOMING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void ensurePromotionCode() {
        if (promotionCode == null || promotionCode.isBlank()) {
            promotionCode = BusinessCodeGenerator.generate("PROM");
        }
    }

    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return status == PromotionStatus.ACTIVE
                && !now.isBefore(startDate)
                && !now.isAfter(endDate);
    }

    public boolean isPercentage() {
        return discountType == DiscountType.PERCENTAGE;
    }

    public boolean appliesToProduct(Long productId, Long categoryId) {
        if (applyType == ApplyType.ORDER) return true;
        if (applyType == ApplyType.PRODUCT) {
            return products.stream().anyMatch(p -> p.getProductId().equals(productId));
        }
        if (applyType == ApplyType.CATEGORY) {
            return categories.stream().anyMatch(c -> c.getCategoryId().equals(categoryId));
        }
        return false;
    }

    public boolean appliesToVariant(Long variantId, Long productId, Long categoryId) {
        if (applyType == ApplyType.ORDER) return true;
        if (applyType == ApplyType.VARIANT) {
            return variants.stream().anyMatch(v -> v.getVariantId().equals(variantId));
        }
        if (applyType == ApplyType.PRODUCT) {
            return products.stream().anyMatch(p -> p.getProductId().equals(productId));
        }
        if (applyType == ApplyType.CATEGORY) {
            return categories.stream().anyMatch(c -> c.getCategoryId().equals(categoryId));
        }
        return false;
    }
}
