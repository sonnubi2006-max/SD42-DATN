package com.base.dto.response.payment;

import com.base.enums.PaymentMethod;
import com.base.enums.PaymentStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class PaymentResponse {

    private Long paymentId;

    private Long orderId;

    private String orderCode;

    private BigDecimal amount;

    private BigDecimal refundedAmount;

    private PaymentMethod paymentMethod;

    private PaymentStatus paymentStatus;

    private String transactionCode;   

    private String bankCode;          

    private String cardType;          

    private LocalDateTime paidAt;

    private LocalDateTime createdAt;
}
