package com.base.dto.response.review;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UnreviewedProductResponse {
    private Long orderDetailId;
    private Long orderId;
    private String orderCode;
    private LocalDateTime completedAt;
    private Long productId;
    private String productCode;
    private String productSlug;
    private String productName;
    private String imageUrl;
    private String size;
    private String color;
}
