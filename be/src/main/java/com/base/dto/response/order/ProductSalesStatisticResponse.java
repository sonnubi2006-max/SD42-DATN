package com.base.dto.response.order;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductSalesStatisticResponse {
    private Long productId;
    private String productName;
    private Long quantity;
    private BigDecimal revenue;
}
