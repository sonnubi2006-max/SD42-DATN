package com.base.dto.response.order;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class StaffSalesStatisticResponse {
    private Long staffId;
    private String staffName;
    private Long orderCount;
    private BigDecimal revenue;
}
