package com.base.dto.response.returnRequest;

import com.base.enums.ReturnStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReturnResponse {

    private Long returnId;

    private Long orderId;

    private Long customerId;

    private String customerCode;

    private String orderCode;

    private String customerName;

    private String customerPhone;

    private BigDecimal refundAmount;

    private com.base.enums.ReturnStatus status;

    private com.base.enums.ReturnType returnType;

    private com.base.enums.ExchangeFulfillmentMethod exchangeFulfillmentMethod;

    private String exchangeReceiverName;

    private String exchangeReceiverPhone;

    private String exchangeDeliveryAddress;

    private BigDecimal exchangeShippingFee;

    private String note;

    private String rejectReason;

    private String images;

    private String processedImages;

    private Long processedById;

    private String processedByName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<ReturnItemResponse> items;

    private List<ExchangeItemResponse> exchangeItems;

    private ExchangeDeliverySummaryResponse exchangeDelivery;
}
