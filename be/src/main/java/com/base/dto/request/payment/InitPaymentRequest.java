package com.base.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InitPaymentRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private Long orderId;

    private String clientIp;
}
