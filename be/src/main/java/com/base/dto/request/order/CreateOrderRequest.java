package com.base.dto.request.order;

import com.base.enums.OrderType;
import com.base.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class CreateOrderRequest {

    @NotNull(message = "Loại đơn hàng không được để trống")
    private OrderType orderType;          

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    private Long couponId;

    private Long promotionId;

    private String note;

    private Long shiftId;

    @NotEmpty(message = "Đơn hàng phải có ít nhất một sản phẩm")
    @Valid
    private List<OrderDetailRequest> items;

    private Boolean isGuest;

    @Size(max = 100, message = "Tên người đặt không được vượt quá 100 ký tự")
    private String guestName;

    @Email(message = "Email người đặt không đúng định dạng")
    @Size(max = 254, message = "Email người đặt không được vượt quá 254 ký tự")
    private String guestEmail;

    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người đặt không đúng định dạng")
    private String guestPhone;

    @Valid
    private OrderAddressRequest orderAddressRequest;

    private java.math.BigDecimal shippingFee;
}
