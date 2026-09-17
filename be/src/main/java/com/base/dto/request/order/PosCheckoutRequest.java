package com.base.dto.request.order;

import com.base.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PosCheckoutRequest {

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    private Long couponId;

    private String note;

    private Boolean delivery;

    @jakarta.validation.Valid
    private OrderAddressRequest orderAddressRequest;

    private java.math.BigDecimal shippingFee;
}
