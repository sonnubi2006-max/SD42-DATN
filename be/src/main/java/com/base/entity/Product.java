package com.base.entity;

import com.base.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String productName;

    @Column(name = "product_slug", unique = true, nullable = false)
    private String productSlug;

    @Column(name = "product_code", unique = true, nullable = false)
    private String productCode;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProductStatus status = ProductStatus.INACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "product",
            orphanRemoval = true
    )
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(
            mappedBy = "product",
            orphanRemoval = true
    )
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(
            mappedBy = "product",
            orphanRemoval = true
    )
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();
}
