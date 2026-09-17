package com.base.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
class OrderNotFoundException extends RuntimeException {
    public OrderNotFoundException(Long orderId) {
        super("Không tìm thấy đơn hàng với id: " + orderId);
    }
    public OrderNotFoundException(String orderCode) {
        super("Không tìm thấy đơn hàng với mã: " + orderCode);
    }
}

@ResponseStatus(HttpStatus.BAD_REQUEST)
class OrderStatusException extends RuntimeException {
    public OrderStatusException(String message) {
        super(message);
    }
}

@ResponseStatus(HttpStatus.BAD_REQUEST)
class InvalidCouponException extends RuntimeException {
    public InvalidCouponException(String message) {
        super(message);
    }
}

