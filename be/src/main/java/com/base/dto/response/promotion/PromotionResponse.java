package com.base.dto.response.promotion;

import com.base.enums.ApplyType;
import com.base.enums.DiscountType;
import com.base.enums.PromotionStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class PromotionResponse {
    private Long promotionId;
    private String promotionCode;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private ApplyType applyType;
    private List<Long> categoryIds;
    private List<Long> productIds;
    private List<Long> variantIds;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private PromotionStatus status;
    private boolean active;
    private LocalDateTime createdAt;
}
