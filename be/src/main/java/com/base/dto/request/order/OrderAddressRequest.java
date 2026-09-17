package com.base.dto.request.order;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.*;

@Getter
@Setter
public class OrderAddressRequest {
    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(
            max = 100,
            message = "Tên người nhận tối đa 100 ký tự"
    )
    private String receiverName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^(0[3|5|7|8|9])+([0-9]{8})$",
            message = "Số điện thoại không hợp lệ"
    )
    private String receiverPhone;

    @NotBlank(message = "Tỉnh/thành phố không được để trống")
    @Size(max = 100)
    private String province;

    @NotBlank(message = "Quận/huyện không được để trống")
    @Size(max = 100)
    private String district;

    @NotBlank(message = "Phường/xã không được để trống")
    @Size(max = 100)
    private String ward;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    @Size(
            max = 255,
            message = "Địa chỉ tối đa 255 ký tự"
    )
    private String detailAddress;

    @Size(
            max = 500,
            message = "Ghi chú tối đa 500 ký tự"
    )
    private String note;
}