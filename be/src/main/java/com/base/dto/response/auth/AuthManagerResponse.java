package com.base.dto.response.auth;

import com.base.enums.RoleUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthManagerResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String username;
    private String email;
    private String fullName;
    private String gender;
    private LocalDate birthday;
    private RoleUser role;
}
