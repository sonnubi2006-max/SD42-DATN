package com.base.dto.request.user;

import com.base.entity.User;
import com.base.enums.RoleUser;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AdminUpdateUserRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(
            min = 2,
            max = 100,
            message = "Họ tên phải từ 2 đến 100 ký tự"
    )
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^(03|05|07|08|09)[0-9]{8}$",
            message = "Số điện thoại Việt Nam không hợp lệ"
    )
    private String phone;

    @Size(
            max = 500,
            message = "Đường dẫn ảnh đại diện không được vượt quá 500 ký tự"
    )
    private String avatar;

    @NotBlank(message = "Giới tính không được để trống")
    @Pattern(
            regexp = "^(MALE|FEMALE)$",
            message = "Giới tính chỉ được là MALE hoặc FEMALE"
    )
    private String gender = "MALE";

    @NotBlank(message = "CCCD không được để trống")
    @Pattern(regexp = "^\\d{12}$", message = "CCCD phải gồm đúng 12 chữ số")
    private String cccd;

    @Past(message = "Ngày sinh phải nhỏ hơn ngày hiện tại")
    @NotNull(message = "Ngày sinh không được để trống")
    private LocalDate birthday;

    @AssertTrue(message = "Nhân viên phải đủ 18 tuổi trở lên")
    public boolean isAdult() {
        return birthday == null || !birthday.isAfter(LocalDate.now().minusYears(18));
    }

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String ward;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    @Size(
            max = 255,
            message = "Địa chỉ chi tiết không được vượt quá 255 ký tự"
    )
    private String streetAddress;

    @NotNull(message = "Vai trò không được để trống")
    private RoleUser role;

    @NotNull(message = "Trạng thái tài khoản không được để trống")
    private User.UserStatus status;
}
