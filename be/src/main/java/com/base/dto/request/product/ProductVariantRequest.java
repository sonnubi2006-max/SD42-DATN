package com.base.dto.request.product;

import com.base.enums.ProductVariantStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantRequest {
    private String variantCode;
    private String size;
    private String color;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal price;

    private Integer stockQuantity = 0;

    private ProductVariantStatus status;
}
