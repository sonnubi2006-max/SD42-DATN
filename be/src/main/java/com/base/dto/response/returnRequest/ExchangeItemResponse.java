package com.base.dto.response.returnRequest;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ExchangeItemResponse {
    private Long exchangeItemId;
    private Long sourceVariantId;
    private String sourceProductName;
    private String sourceColor;
    private String sourceSize;
    private Long variantId;
    private Long productId;
    private String productCode;
    private String productSlug;
    private String productName;
    private String variantCode;
    private String imageUrl;
    private String color;
    private String size;
    private Integer quantity;
    private BigDecimal priceDifference;
}
