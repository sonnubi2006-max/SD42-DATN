package com.base.dto.response.product;

import com.base.enums.ProductVariantStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {
    private Long variantId;
    private String variantCode;
    private String barcode;
    private String size;
    private String color;
    private BigDecimal price;
    private Integer stockQuantity;
    private Integer availableStock;
    private Integer damagedQuantity;
    private ProductImageResponse image;
    private LocalDateTime createdAt;
    private ProductVariantStatus status;
    private Long productId;
    private String productName;
    private String productCode;
    private BigDecimal salePrice;
    private Integer discountPercentage;
}
