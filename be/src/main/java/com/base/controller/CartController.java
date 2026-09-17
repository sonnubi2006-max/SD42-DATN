package com.base.controller;

import com.base.dto.request.cart.CartItemRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.cart.CartItemResponse;
import com.base.dto.response.cart.CartResponse;
import com.base.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getMyCart() {
        return ResponseEntity.ok(ApiResponse.success(cartService.getMyCart()));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartItemResponse>> addToCart(
            @RequestBody @Valid CartItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(cartService.addToCart(request)));
    }

    @PutMapping("/items")
    public ResponseEntity<ApiResponse<CartItemResponse>> updateQuantity(
            @RequestBody @Valid CartItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(cartService.updateQuantity(request)));
    }

    @PatchMapping("/items/{cartItemId}/increase")
    public ResponseEntity<ApiResponse<CartItemResponse>> increaseQuantity(
            @PathVariable Long cartItemId
    ) {
        return ResponseEntity.ok(ApiResponse.success(cartService.increaseQuantity(cartItemId)));
    }

    @PatchMapping("/items/{cartItemId}/decrease")
    public ResponseEntity<ApiResponse<CartItemResponse>> decreaseQuantity(
            @PathVariable Long cartItemId
    ) {
        Optional<CartItemResponse> result = cartService.decreaseQuantity(cartItemId);

        return result
                .map(item -> ResponseEntity.ok(ApiResponse.success(item)))
                .orElse(ResponseEntity.noContent().build());
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @PathVariable Long cartItemId
    ) {
        cartService.removeItem(cartItemId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/items")
    public ResponseEntity<ApiResponse<Void>> removeItems(
            @RequestBody List<Long> cartItemIds
    ) {
        cartService.removeItems(cartItemIds);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        cartService.clearCart();
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countItems() {
        return ResponseEntity.ok(ApiResponse.success(cartService.countItems()));
    }

    @GetMapping("/total")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateTotal() {
        return ResponseEntity.ok(ApiResponse.success(cartService.calculateTotal()));
    }

    @GetMapping("/exists/{variantId}")
    public ResponseEntity<ApiResponse<Boolean>> existsInCart(
            @PathVariable Long variantId
    ) {
        return ResponseEntity.ok(ApiResponse.success(cartService.existsInCart(variantId)));
    }
}
