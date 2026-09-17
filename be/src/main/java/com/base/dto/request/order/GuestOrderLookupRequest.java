package com.base.dto.request.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuestOrderLookupRequest {

    @NotBlank(message = "Mã đơn hàng không được để trống")
    @Size(max = 50, message = "Mã đơn hàng không hợp lệ")
    private String orderCode;

    @NotBlank(message = "Số điện thoại người đặt không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người đặt không đúng định dạng")
    private String phone;
}
