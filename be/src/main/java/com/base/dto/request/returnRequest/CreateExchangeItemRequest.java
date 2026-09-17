package com.base.dto.request.returnRequest;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateExchangeItemRequest {
    @NotNull(message = "Sản phẩm lỗi cần đổi không được để trống")
    private Long sourceVariantId;

    @NotNull(message = "Variant mới không được để trống")
    private Long newVariantId;

    @NotNull(message = "Số lượng đổi không được để trống")
    @Min(value = 1, message = "Số lượng đổi phải lớn hơn 0")
    private Integer newQuantity;

    private BigDecimal priceDifference;
}
