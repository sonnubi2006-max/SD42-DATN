package com.base.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, String field, Object value) {
        super(String.format("Không tìm thấy %s với %s: '%s'",
                localizeResource(resource), localizeField(field), value));
    }
    public ResourceNotFoundException(String message) { super(message); }

    private static String localizeResource(String resource) {
        return switch (resource) {
            case "User" -> "người dùng";
            case "Customer" -> "khách hàng";
            case "Product" -> "sản phẩm";
            case "ProductVariant" -> "biến thể sản phẩm";
            case "Cart" -> "giỏ hàng";
            case "Wishlist" -> "sản phẩm yêu thích";
            case "Order" -> "đơn hàng";
            default -> resource;
        };
    }

    private static String localizeField(String field) {
        return switch (field) {
            case "id" -> "mã";
            case "username" -> "tên đăng nhập";
            case "variantId" -> "mã biến thể";
            default -> field;
        };
    }
}
