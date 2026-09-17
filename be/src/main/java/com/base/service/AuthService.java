package com.base.service;

import com.base.dto.request.auth.LoginRequest;
import com.base.dto.request.auth.RefreshTokenRequest;
import com.base.dto.request.auth.RegisterRequest;
import com.base.dto.request.auth.ResetPasswordRequest;
import com.base.dto.response.auth.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String username);
    void forgotPassword(String email);
    void resetPassword(ResetPasswordRequest request);

}
