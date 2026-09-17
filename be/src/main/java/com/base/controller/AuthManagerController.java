package com.base.controller;

import com.base.dto.request.auth.*;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.auth.AuthManagerResponse;
import com.base.service.AuthManagerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.base.dto.request.auth.ForgotPasswordRequest;
import com.base.dto.request.auth.ResetPasswordRequest;

@RestController
@RequestMapping("/api/v1/auth/manager")
@RequiredArgsConstructor
public class AuthManagerController {

    private final AuthManagerService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthManagerResponse>> register(@Valid @RequestBody RegisterManagerRequest request) {
        AuthManagerResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthManagerResponse>> login(@Valid @RequestBody LoginManagerRequest request) {
        AuthManagerResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthManagerResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthManagerResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "Hướng dẫn đặt lại mật khẩu đã được gửi đến email", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }
}
