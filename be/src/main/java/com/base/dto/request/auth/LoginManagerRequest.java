package com.base.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginManagerRequest {
    @NotBlank(message = "Tên tài khoản không để trống")
    private String username;

    @NotBlank(message = "Mật khẩu không để trống")
    @Size(min = 6, message = "Mật khẩu không đúng định dạng")
    private String password;
}
