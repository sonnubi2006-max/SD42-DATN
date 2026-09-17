package com.base.dto.response.returnRequest;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class RefundPreviewResponse {

    private BigDecimal totalRefund;

    private BigDecimal totalDiscount;

    private BigDecimal orderSubtotal;

    private BigDecimal paidAmount;

    private List<ItemPreview> items;

    @Data
    @Builder
    public static class ItemPreview {
        private Long variantId;
        private String productName;
        private String color;
        private String size;

        private Integer quantity;

        private BigDecimal unitPrice;

        private BigDecimal lineSubtotal;

        private BigDecimal allocatedDiscount;

        private BigDecimal refundAmount;
    }
}
