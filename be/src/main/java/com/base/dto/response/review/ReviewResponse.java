package com.base.dto.response.review;

import com.base.enums.ReviewStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ReviewResponse {

    private Long reviewId;

    private Long userId;

    private String userName;

    private Long productId;

    private String productName;

    private String productCode;

    private String productSlug;

    private Long variantId;

    private Long orderId;

    private String orderCode;

    private String color;

    private String size;

    private Integer rating;

    private String comment;

    private String sizeFeedback;

    private boolean verifiedPurchase;

    private ReviewStatus status;

    private String productImageUrl;

    private List<String> images;

    private LocalDateTime createdAt;
}
