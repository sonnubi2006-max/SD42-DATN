package com.base.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String productName, int requested, int available) {
        super(String.format(
                "Sản phẩm '%s' không đủ tồn kho. Yêu cầu: %d, còn lại: %d",
                productName, requested, available
        ));
    }
}
