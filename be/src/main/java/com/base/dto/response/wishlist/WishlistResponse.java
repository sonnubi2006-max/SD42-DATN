package com.base.dto.response.wishlist;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class WishlistResponse {

    private Long wishlistId;

    private Long productId;

    private Long variantId;

    private String productName;

    private String productCode;

    private String productSlug;

    private String imageUrl;

    private String color;

    private String size;

    private BigDecimal price;

    private LocalDateTime createdAt;

    private BigDecimal salePrice;

    private Integer discountPercentage;

    private String productStatus;

    private String variantStatus;

    private Integer stockQuantity;
}
