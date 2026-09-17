package com.base.dto.response.cart;

import com.base.entity.CartItem;
import lombok.Data;

import java.util.List;

@Data
public class CartResponse {
    private Long cartId;
    private List<CartItemResponse> items;
}
