package com.base.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_details")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_detail_id")
    private Long orderDetailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private ProductVariant variant;

    @Column(columnDefinition = "NVARCHAR(255)", name = "product_name", nullable = false)
    private String productName;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(columnDefinition = "NVARCHAR(25)", nullable = false)
    private String size;

    @Column(columnDefinition = "NVARCHAR(25)", nullable = false)
    private String color;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "damaged_quantity", nullable = false)
    @Builder.Default
    private Integer damagedQuantity = 0;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(precision = 15, scale = 2)
    private BigDecimal salePrice;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "orderDetail", fetch = FetchType.LAZY)
    private Review review;
}
