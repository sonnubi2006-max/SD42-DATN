package com.base.dto.response.product;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VariantInventoryResponse {
    private Long variantId;
    private String sku;
    private String barcode;
    private String size;
    private String color;
}
