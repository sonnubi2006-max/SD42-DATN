package com.base.dto.response.cart;

import com.base.entity.ProductImage;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartVariantResponse {
    private Long variantId;
    private BigDecimal price;
    private BigDecimal salePrice;
    private String color;
    private String size;
    private Integer stockQuantity;
    private String status;
    private CartVariantImageResponse image;
    private CartProductResponse product;
}
