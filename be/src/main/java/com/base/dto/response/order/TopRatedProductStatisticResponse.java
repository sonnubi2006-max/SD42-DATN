package com.base.dto.response.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopRatedProductStatisticResponse {
    private Long productId;
    private String productName;
    private Double averageRating;
    private Long reviewCount;
}
