package com.base.dto.response.review;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSummaryResponse {

    private Long productId;

    private Double averageRating;

    private Long reviewCount;

    private Long fiveStar;

    private Long fourStar;

    private Long threeStar;

    private Long twoStar;

    private Long oneStar;

    private Double fiveStarPercent;

    private Double fourStarPercent;

    private Double threeStarPercent;

    private Double twoStarPercent;

    private Double oneStarPercent;
}