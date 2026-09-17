package com.base.dto.request.user;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserRequest {
    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
    @Pattern(
            regexp = "^[\\p{L}][\\p{L}\\s.'’\\-]*$",
            message = "Họ tên chỉ được chứa chữ cái và dấu cách"
    )
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^(03|05|07|08|09)[0-9]{8}$",
            message = "Số điện thoại Việt Nam không hợp lệ"
    )
    private String phone;

    @NotBlank(message = "Giới tính không được để trống")
    @Pattern(
            regexp = "^(MALE|FEMALE)$",
            message = "Giới tính chỉ được là MALE hoặc FEMALE"
    )
    private String gender;

    @NotNull(message = "Ngày sinh không được để trống")
    @Past(message = "Ngày sinh phải nhỏ hơn ngày hiện tại")
    private LocalDate birthday;

    @AssertTrue(message = "Nhân viên phải đủ 18 tuổi trở lên")
    public boolean isAdult() {
        return birthday == null || !birthday.isAfter(LocalDate.now().minusYears(18));
    }
}
