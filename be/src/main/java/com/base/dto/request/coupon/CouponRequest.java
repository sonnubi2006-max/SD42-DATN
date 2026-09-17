package com.base.dto.request.coupon;

import com.base.enums.CouponStatus;
import com.base.enums.CouponType;
import com.base.enums.DiscountType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class CouponRequest {

    @NotBlank(message = "Mã giảm giá không được để trống")
    @Size(min = 4, max = 50, message = "Mã giảm giá phải từ 4 đến 50 ký tự")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Mã giảm giá chỉ gồm chữ hoa, số và dấu _")
    private String code;

    @Size(max = 200)
    private String description;

    @NotNull(message = "Loại giảm giá không được để trống")
    private DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.01", message = "Giới hạn giảm tối đa phải lớn hơn 0")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0", message = "Giá trị đơn tối thiểu không được âm")
    private BigDecimal minOrderValue;

    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer totalQuantity;

    @Min(value = 1)
    private Integer maxUsesPerUser;

    private CouponStatus status;

    private CouponType couponType;

    private List<Long> targetedCustomerIds;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDateTime endDate;
}
