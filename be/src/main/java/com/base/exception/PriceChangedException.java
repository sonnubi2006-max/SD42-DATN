package com.base.exception;

import com.base.dto.response.order.PriceChangeResponse;
import lombok.Getter;

import java.util.List;

@Getter
public class PriceChangedException extends RuntimeException {
    private final List<PriceChangeResponse> priceChanges;

    public PriceChangedException(List<PriceChangeResponse> priceChanges) {
        super("Giá sản phẩm đã thay đổi. Vui lòng kiểm tra và xác nhận giá mới.");
        this.priceChanges = priceChanges;
    }
}
