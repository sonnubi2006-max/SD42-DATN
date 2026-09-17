package com.base.dto.request.user;

import com.base.enums.RoleUser;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateAccountRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^(03|05|07|08|09)[0-9]{8}$",
            message = "Số điện thoại Việt Nam không hợp lệ"
    )
    private String phone;

    @NotBlank(message = "CCCD không được để trống")
    @Pattern(regexp = "^\\d{12}$", message = "CCCD phải gồm đúng 12 chữ số")
    private String cccd;

    @NotNull(message = "Role không được để trống")
    private RoleUser role;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String ward;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String streetAddress;

    @Past(message = "Ngày sinh phải nhỏ hơn ngày hiện tại")
    @NotNull(message = "Ngày sinh không được để trống")
    private LocalDate birthday;

    @NotBlank(message = "Giới tính không được để trống")
    @Pattern(regexp = "^(MALE|FEMALE)$", message = "Giới tính chỉ được là MALE hoặc FEMALE")
    private String gender = "MALE";

    @AssertTrue(message = "Nhân viên phải đủ 18 tuổi trở lên")
    public boolean isAdult() {
        return birthday == null || !birthday.isAfter(LocalDate.now().minusYears(18));
    }
}
