package com.base.dto.response.returnRequest;

import com.base.enums.ExchangeDeliveryStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExchangeDeliveryLogResponse {
    private Long logId;
    private ExchangeDeliveryStatus previousStatus;
    private ExchangeDeliveryStatus currentStatus;
    private String note;
    private List<String> evidenceImages;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
}
