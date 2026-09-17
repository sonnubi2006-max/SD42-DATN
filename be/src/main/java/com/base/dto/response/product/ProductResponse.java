package com.base.dto.response.product;

import com.base.dto.response.brand.BrandResponse;
import com.base.dto.response.category.CategoryResponse;
import com.base.enums.ProductStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long productId;
    private String productName;
    private String productCode;
    private String productSlug;
    private String description;
    private BigDecimal averageRating;
    private CategoryResponse category;
    private BrandResponse brand;
    private ProductStatus status;
    private List<ProductImageResponse> images;
    private List<ProductVariantResponse> variants;
    private Long totalSold;
    private Integer damagedQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
