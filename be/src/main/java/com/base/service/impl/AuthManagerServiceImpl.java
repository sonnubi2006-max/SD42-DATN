package com.base.service.impl;

import com.base.dto.event.EmailMessage;
import com.base.dto.request.auth.*;
import com.base.dto.response.auth.AuthManagerResponse;
import com.base.entity.RefreshToken;
import com.base.entity.User;
import com.base.enums.AccountType;
import com.base.enums.EmailType;
import com.base.enums.RoleUser;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceAlreadyExistsException;
import com.base.exception.ResourceNotFoundException;
import com.base.exception.UnauthorizedException;
import com.base.queue.EmailProducer;
import com.base.repository.UserRepository;
import com.base.security.jwt.JwtService;
import com.base.service.AuthManagerService;
import com.base.service.PasswordResetService;
import com.base.service.RefreshTokenService;
import com.base.utils.CredentialGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthManagerServiceImpl implements AuthManagerService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final CredentialGenerator credentialGenerator;
    private final EmailProducer emailProducer;
    private final PasswordResetService passwordResetService;

    @Value("${app.frontend.admin-url}")
    private String adminUrl;

    @Override
    @Transactional
    public AuthManagerResponse register(RegisterManagerRequest request) {
        if (request.getRole() != RoleUser.ADMIN && request.getRole() != RoleUser.STAFF) {
            throw new BadRequestException("Chỉ được tạo tài khoản ADMIN hoặc STAFF");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Email đã được đăng ký!");
        }

        String username = generateUniqueUsername(request.getEmail());

        String rawPassword = credentialGenerator.generatePassword();

        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .gender(request.getGender())
                .birthday(request.getBirthday())
                .cccd(request.getCccd())
                .province(request.getProvince())
                .district(request.getDistrict())
                .ward(request.getWard())
                .streetAddress(request.getStreetAddress())
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .role(request.getRole())
                .build();

        userRepository.save(user);
        log.info("User registered: {}", user.getUsername());

        emailProducer.send(EmailMessage.builder()
                .to(user.getEmail())
                .recipientName(user.getFullName() != null ? user.getFullName() : username)
                .type(EmailType.ACCOUNT_CREATED)
                .data(Map.of(
                        "username", username,
                        "password", rawPassword,
                        "loginUrl", adminUrl + "/login"
                ))
                .build());

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshTokenManager(user);

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    @Override
    public AuthManagerResponse login(LoginManagerRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));
        ensureUserCanLogin(user);

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshTokenManager(user);

        log.info("User logged in: {}", user.getUsername());
        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    @Override
    public AuthManagerResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        ensureUserCanLogin(user);
        String accessToken = jwtService.generateToken(user);

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    private void ensureUserCanLogin(User user) {
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new UnauthorizedException(
                    "Tài khoản nhân viên đã bị vô hiệu hóa. Vui lòng liên hệ quản lý cửa hàng để được hỗ trợ."
            );
        }
    }

    @Override
    @Transactional
    public void logout(String username) {
        userRepository.findByUsername(username)
                .ifPresent(user -> {
                    refreshTokenService.deleteByUser(user);
                    log.info("User logged out: {}", username);
                });
    }

    @Override
    public void forgotPassword(String email) {
        passwordResetService.requestReset(email, AccountType.USER);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        passwordResetService.resetPassword(
                request.getToken(),
                request.getNewPassword(),
                request.getConfirmPassword()
        );
    }

    private String generateUniqueUsername(String email) {
        String username;
        do {
            username = credentialGenerator.generateUsername(email);
        } while (userRepository.existsByUsername(username));
        return username;
    }

    private AuthManagerResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthManagerResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .username(user.getUsername())
                .birthday(user.getBirthday())
                .fullName(user.getFullName())
                .gender(user.getGender())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
