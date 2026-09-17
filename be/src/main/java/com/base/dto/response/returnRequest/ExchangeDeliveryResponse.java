package com.base.dto.response.returnRequest;

import com.base.enums.ExchangeDeliveryStatus;
import com.base.enums.ExchangeFulfillmentMethod;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExchangeDeliveryResponse {
    private Long exchangeDeliveryId;
    private String deliveryCode;
    private ExchangeDeliveryStatus status;
    private ExchangeFulfillmentMethod fulfillmentMethod;
    private Long returnId;
    private Long orderId;
    private String orderCode;
    private Long customerId;
    private String customerCode;
    private Long processedById;
    private String processedByName;
    private String receiverName;
    private String receiverPhone;
    private String deliveryAddress;
    private BigDecimal shippingFee;
    private String note;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime returnedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ExchangeItemResponse> items;
    private List<ExchangeDeliveryLogResponse> history;
}
