package com.base.dto.response.returnRequest;

import com.base.enums.ExchangeDeliveryStatus;
import com.base.enums.ExchangeFulfillmentMethod;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ExchangeDeliverySummaryResponse {
    private Long exchangeDeliveryId;
    private String deliveryCode;
    private ExchangeDeliveryStatus status;
    private ExchangeFulfillmentMethod fulfillmentMethod;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime updatedAt;
}
