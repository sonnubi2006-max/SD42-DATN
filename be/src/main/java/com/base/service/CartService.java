package com.base.service;

import com.base.dto.request.cart.CartItemRequest;
import com.base.dto.response.cart.CartItemResponse;
import com.base.dto.response.cart.CartResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface CartService {

    CartResponse getMyCart();

    CartItemResponse addToCart(CartItemRequest cartItemRequest);

    CartItemResponse updateQuantity(CartItemRequest cartItemRequest);

    CartItemResponse increaseQuantity(Long cartItemId);

    Optional<CartItemResponse> decreaseQuantity(Long cartItemId);

    void removeItem(Long cartItemId);

    void removeItems(List<Long> cartItemIds);

    void clearCart();

    Long countItems();

    boolean existsInCart(Long variantId);

    BigDecimal calculateTotal();

}
