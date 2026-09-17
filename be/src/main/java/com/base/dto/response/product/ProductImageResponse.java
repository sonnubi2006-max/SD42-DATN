package com.base.dto.response.product;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageResponse {
    private Long imageId;
    private String imageUrl;
    private boolean isThumbnail;
}
