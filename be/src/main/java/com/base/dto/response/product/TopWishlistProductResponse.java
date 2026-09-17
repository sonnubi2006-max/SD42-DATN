package com.base.dto.response.product;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopWishlistProductResponse {

    private Long productId;

    private String productName;

    private String imageUrl;

    private Long wishlistCount;
}
