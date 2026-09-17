package com.base.dto.response.order;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PriceChangeResponse {
    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private BigDecimal checkoutPrice;
    private BigDecimal currentPrice;
    private BigDecimal originalPrice;
}
