package com.base.dto.response.cart;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartProductResponse {
    private Long productId;
    private String productName;
    private String status;
}
