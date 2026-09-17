package com.base.dto.request.order;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CouponCreateOrderRequest {
    private Long couponId;

    private BigDecimal discountAmount;
}