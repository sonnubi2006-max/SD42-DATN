package com.base.dto.response.cart;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartInventoryResponse {
    private Integer stockQuantity;
}
