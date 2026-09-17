package com.base.dto.response.order;

import com.base.dto.response.returnRequest.ReturnResponse;
import com.base.enums.OrderStatus;
import com.base.enums.OrderType;
import com.base.enums.PaymentMethod;
import com.base.enums.CustomerSource;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
public class OrderResponse {

    private Long orderId;
    private String orderCode;

    private Long customerId;
    private CustomerSource customerSource;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerAddress;

    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;

    private String guestName;
    private String guestPhone;
    private String guestEmail;

    private Long staffId;
    private String staffName;

    private OrderType orderType;
    private OrderStatus orderStatus;
    private PaymentMethod paymentMethod;

    private Long couponId;
    private String couponCode;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;

    private String note;
    private LocalDateTime orderDate;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private LocalDateTime returnDeadline;
    private Boolean canReturn;
    private Integer completedReturnCount;
    private BigDecimal completedRefundAmount;
    private BigDecimal netRevenue;

    private List<OrderDetailResponse> orderDetails;
    private List<ReturnResponse> returnRequests;
    private List<OrderTransactionLogResponse> transactionLogs;
}

