package com.base.dto.response.order;

import com.base.enums.OrderStatus;
import com.base.enums.OrderType;
import com.base.enums.PaymentMethod;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
public class OrderSummaryResponse {

    private Long orderId;
    private String orderCode;
    private String customerName;
    private String customerPhone;
    private String receiverName;
    private String receiverPhone;
    private OrderType orderType;
    private OrderStatus orderStatus;
    private PaymentMethod paymentMethod;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private int totalItems;
    private LocalDateTime orderDate;
    private LocalDateTime completedAt;
}
