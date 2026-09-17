package com.base.dto.response.payment;

import com.base.enums.PaymentStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class InitPaymentResponse {

    private Long paymentId;

    private String orderCode;

    private BigDecimal amount;

    private String paymentUrl;       

    private PaymentStatus status;

    private LocalDateTime expireAt;  
}
