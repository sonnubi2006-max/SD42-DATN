package com.base.dto.request.auth;

import com.base.enums.RoleUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterManagerRequest {

    @NotBlank(message = "Email không để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private String fullName;

    private String phone;

    private String gender;

    private LocalDate birthday;

    @NotNull(message = "Vai trò không được để trống")
    private RoleUser role;

    private String cccd;

    private String province;
    private String district;
    private String ward;
    private String streetAddress;
}
