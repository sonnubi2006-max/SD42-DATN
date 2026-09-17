package com.base.dto.request.customer;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CustomerRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(
            min = 2,
            max = 100,
            message = "Họ tên từ 2 - 100 ký tự"
    )
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^(0[3|5|7|8|9])[0-9]{8}$",
            message = "Số điện thoại không hợp lệ"
    )
    private String phone;

    @NotBlank(message = "Giới tính không được để trống")
    @Pattern(
            regexp = "^(MALE|FEMALE)$",
            message = "Giới tính chỉ được là MALE hoặc FEMALE"
    )
    private String gender = "MALE";

    @Past(
            message = "Ngày sinh phải nhỏ hơn ngày hiện tại"
    )
    private LocalDate birthday;

    @AssertTrue(message = "Khách hàng phải đủ 18 tuổi trở lên")
    public boolean isAdult() {
        return birthday == null || !birthday.isAfter(LocalDate.now().minusYears(18));
    }

    private String avatar;

    @NotNull(message = "Trạng thái đăng ký email không được để trống")
    private Boolean emailSubscribed;
}
