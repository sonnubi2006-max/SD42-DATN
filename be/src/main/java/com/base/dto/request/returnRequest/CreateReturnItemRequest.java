package com.base.dto.request.returnRequest;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateReturnItemRequest {

    private Long productId;

    private String productName;

    @NotNull(message = "Variant không được để trống")
    private Long variantId;

    private String sku;

    private String color;

    private String size;

    @NotNull(message = "Số lượng trả không được để trống")
    @Min(value = 1, message = "Số lượng trả phải lớn hơn 0")
    private Integer quantity;

    private BigDecimal originalPrice;

    private BigDecimal refundPrice;

    private String reason;
}
