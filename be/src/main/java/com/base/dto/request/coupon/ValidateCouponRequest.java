package com.base.dto.request.coupon;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ValidateCouponRequest {

    @NotBlank
    private String code;

    @NotNull
    private BigDecimal orderAmount;
}
