package com.base.entity;

import com.base.enums.CouponStatus;
import com.base.enums.CouponType;
import com.base.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "coupons")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "coupon_id")
    private Long couponId;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(columnDefinition = "NVARCHAR(255)", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;         

    @Column(name = "discount_value", precision = 15, scale = 2, nullable = false)
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 15, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_value", precision = 15, scale = 2)
    private BigDecimal minOrderValue;

    @Column(name = "total_quantity")
    private Integer totalQuantity;

    @Column(name = "used_quantity", nullable = false)
    @Builder.Default
    private Integer usedQuantity = 0;

    @Column(name = "max_uses_per_user")
    private Integer maxUsesPerUser;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CouponStatus status = CouponStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "coupon_type", nullable = false)
    @Builder.Default
    private CouponType couponType = CouponType.PUBLIC;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "coupon_customers",
            joinColumns = @JoinColumn(name = "coupon_id"),
            inverseJoinColumns = @JoinColumn(name = "customer_id")
    )
    @Builder.Default
    private Set<Customer> targetedCustomers = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        if (status == CouponStatus.INACTIVE || status == CouponStatus.EXPIRED) return false;
        if (startDate != null && now.isBefore(startDate)) return false;
        if (endDate   != null && now.isAfter(endDate))    return false;
        if (totalQuantity != null
                && usedQuantity != null
                && usedQuantity >= totalQuantity) return false;
        return true;
    }

    public boolean isPercentage() {
        return discountType == DiscountType.PERCENTAGE;
    }

    public boolean isPersonal() {
        return couponType == CouponType.PERSONAL;
    }
}
