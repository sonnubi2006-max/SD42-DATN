package com.base.dto.response.returnRequest;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReturnItemResponse {

    private Long returnItemId;

    private Long productId;
    private String productCode;
    private String productSlug;

    private String productName;

    private Long variantId;

    private String sku;

    private String imageUrl;

    private String color;

    private String size;

    private Integer quantity;

    private Integer damagedQuantity;

    private BigDecimal originalPrice;

    private BigDecimal refundPrice;

    private String reason;
}
