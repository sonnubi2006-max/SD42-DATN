package com.base.dto.response.inventory;

import com.base.dto.response.product.ProductVariantResponse;
import com.base.dto.response.product.VariantInventoryResponse;
import com.base.entity.ProductVariant;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InventoryResponse {

    private Long inventoryId;

    private Long variantId;

    private String sku;

    private String productName;

    private Integer stockQuantity;

    private BigDecimal avgCostPrice;

    private VariantInventoryResponse variant;
}
