package com.base.dto.request.promotion;

import com.base.enums.ApplyType;
import com.base.enums.DiscountType;
import com.base.enums.PromotionStatus;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class PromotionRequest {

    @NotBlank(message = "Tên chương trình không được để trống")
    @Size(max = 200)
    private String name;

    private String description;

    @NotNull
    private DiscountType discountType;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal discountValue;

    private BigDecimal maxDiscountAmount;

    @NotNull(message = "Loại áp dụng không được để trống")
    private ApplyType applyType;

    private List<Long> categoryIds;

    private List<Long> productIds;

    private List<Long> variantIds;

    @NotNull
    private LocalDateTime startDate;

    @NotNull
    private LocalDateTime endDate;

    private PromotionStatus status;
}
