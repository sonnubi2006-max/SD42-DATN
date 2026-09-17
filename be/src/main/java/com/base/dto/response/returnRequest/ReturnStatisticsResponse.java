package com.base.dto.response.returnRequest;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ReturnStatisticsResponse {

    private long returnedOrderCount;

    private long completedReturnCount;

    private BigDecimal totalRefundAmount;

    private BigDecimal posRefundAmount;

    private BigDecimal onlineRefundAmount;

    private BigDecimal cashRefundAmount;

    private BigDecimal transferRefundAmount;

    private List<DailyRefundResponse> dailyRefunds;

    @Data
    @Builder
    public static class DailyRefundResponse {

        private String date;

        private BigDecimal refundAmount;

        private BigDecimal cashRefundAmount;

        private BigDecimal transferRefundAmount;
    }
}
