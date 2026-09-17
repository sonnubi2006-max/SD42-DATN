package com.base.dto.response.coupon;

import com.base.enums.CouponStatus;
import com.base.enums.CouponType;
import com.base.enums.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class CouponResponse {
    private Long couponId;
    private String code;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private Integer totalQuantity;
    private Integer usedQuantity;
    private Integer remainingQuantity;
    private Integer maxUsesPerUser;
    private Long usedByCurrentUser;
    private Long remainingUsesForCurrentUser;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private CouponStatus status;
    private CouponType couponType;
    private List<TargetedCustomer> targetedCustomers;
    private boolean valid;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TargetedCustomer {
        private Long customerId;
        private String fullName;
        private String email;
    }
}
