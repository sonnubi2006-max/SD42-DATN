package com.base.service;

import com.base.dto.request.auth.LoginManagerRequest;
import com.base.dto.request.auth.RefreshTokenRequest;
import com.base.dto.request.auth.RegisterManagerRequest;
import com.base.dto.request.auth.ResetPasswordRequest;
import com.base.dto.response.auth.AuthManagerResponse;

public interface AuthManagerService {
    AuthManagerResponse register(RegisterManagerRequest request);
    AuthManagerResponse login(LoginManagerRequest request);
    AuthManagerResponse refreshToken(RefreshTokenRequest request);
    void logout(String username);
    void forgotPassword(String email);
    void resetPassword(ResetPasswordRequest request);
}
