package com.base.dto.request.order;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PromotionCreateOrderRequest {
    private Long promotionId;

    private BigDecimal discountAmount;
}