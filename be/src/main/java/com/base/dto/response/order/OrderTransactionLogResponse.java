package com.base.dto.response.order;

import com.base.enums.OrderStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
public class OrderTransactionLogResponse {
    private Long logId;
    private OrderStatus previousStatus;
    private OrderStatus currentStatus;
    private String action;
    private String note;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<OrderTransactionLogImageResponse> images;
}
