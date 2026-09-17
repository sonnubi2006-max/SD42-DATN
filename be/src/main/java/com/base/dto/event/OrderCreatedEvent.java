package com.base.dto.event;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent {

    private Long orderId;

    private Long userId;

    private String customerEmail;

    private String customerName;

    private BigDecimal totalAmount;

    private List<OrderItemEvent> items;
}
