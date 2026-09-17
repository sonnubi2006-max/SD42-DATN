package com.base.dto.response.cart;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long cartItemId;

    private Integer quantity;

    private BigDecimal price;

    private CartVariantResponse variant;
}