package com.base.service.impl;

import com.base.dto.request.auth.LoginRequest;
import com.base.dto.request.auth.RefreshTokenRequest;
import com.base.dto.request.auth.RegisterRequest;
import com.base.dto.request.auth.ResetPasswordRequest;
import com.base.dto.response.auth.AuthResponse;
import com.base.entity.Cart;
import com.base.entity.Customer;
import com.base.entity.RefreshToken;
import com.base.enums.AccountType;
import com.base.enums.CustomerSource;
import com.base.exception.ResourceAlreadyExistsException;
import com.base.exception.UnauthorizedException;
import com.base.repository.CartRepository;
import com.base.repository.CustomerRepository;
import com.base.security.jwt.JwtService;
import com.base.service.AuthService;
import com.base.service.GuestOrderLinkService;
import com.base.service.PasswordResetService;
import com.base.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final CartRepository cartRepository;
    private final PasswordResetService passwordResetService;
    private final GuestOrderLinkService guestOrderLinkService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        Customer customer = customerRepository.findByEmailIgnoreCase(normalizedEmail)
                .map(existing -> upgradeGuestCustomer(existing, request))
                .orElseGet(() -> Customer.builder()
                        .email(normalizedEmail)
                        .phone(trimToNull(request.getPhone()))
                        .fullName(trimToNull(request.getFullName()))
                        .password(passwordEncoder.encode(request.getPassword()))
                        .source(CustomerSource.REGISTERED)
                        .build());

        customer = customerRepository.save(customer);

        if (cartRepository.findByCustomer_CustomerId(customer.getCustomerId()).isEmpty()) {
            cartRepository.save(Cart.builder()
                    .customer(customer)
                    .build());
        }

        guestOrderLinkService.linkUnassignedOrders(customer);

        log.info("User registered: {}", customer.getUsername());

        String accessToken = jwtService.generateToken(customer);

        RefreshToken refreshToken =
                refreshTokenService.createRefreshToken(customer);

        return buildAuthResponse(
                customer,
                accessToken,
                refreshToken.getToken()
        );
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Customer customer =
                customerRepository.findByEmailIgnoreCase(normalizedEmail)
                        .orElseThrow(() ->
                                new UnauthorizedException(
                                        "Email không tồn tại"
                                )
                        );
        ensureCustomerCanLogin(customer);
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            normalizedEmail,
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e){
            throw new BadCredentialsException(
                    "Mật khẩu không chính xác"
            );
        }

        String accessToken = jwtService.generateToken(customer);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(customer);

        guestOrderLinkService.linkUnassignedOrders(customer);

        log.info("User logged in: {}", customer.getUsername());
        return buildAuthResponse(customer, accessToken, refreshToken.getToken());
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.verifyExpiration(refreshToken);

        Customer customer = refreshToken.getCustomer();
        ensureCustomerCanLogin(customer);
        guestOrderLinkService.linkUnassignedOrders(customer);
        String accessToken = jwtService.generateToken(customer);

        return buildAuthResponse(customer, accessToken, refreshToken.getToken());
    }

    private void ensureCustomerCanLogin(Customer customer) {
        if (customer.getStatus() != Customer.CustomerStatus.ACTIVE) {
            throw new UnauthorizedException(
                    "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ cửa hàng để được hỗ trợ."
            );
        }
    }

    @Override
    @Transactional
    public void logout(String email) {
        customerRepository.findByEmail(email)
                .ifPresent(customer -> {
                    refreshTokenService.deleteByCustomer(customer);
                    log.info("User logged out: {}", email);
                });
    }

    @Override
    public void forgotPassword(String email) {
        passwordResetService.requestReset(email, AccountType.CUSTOMER);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        passwordResetService.resetPassword(
                request.getToken(),
                request.getNewPassword(),
                request.getConfirmPassword()
        );
    }

    private AuthResponse buildAuthResponse(Customer customer, String accessToken, String refreshToken) {
        AuthResponse response = new AuthResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setBirthday(customer.getBirthday());
        response.setFullName(customer.getFullName());
        response.setGender(customer.getGender());
        response.setEmail(customer.getEmail());
        return response;
    }

    private Customer upgradeGuestCustomer(Customer customer, RegisterRequest request) {
        if (customer.getSource() != CustomerSource.GUEST || customer.getPassword() != null) {
            throw new ResourceAlreadyExistsException("Email đã được đăng ký!");
        }
        ensureCustomerCanLogin(customer);

        customer.setEmail(normalizeEmail(request.getEmail()));
        customer.setPassword(passwordEncoder.encode(request.getPassword()));
        customer.setSource(CustomerSource.REGISTERED);
        if (trimToNull(request.getFullName()) != null) {
            customer.setFullName(trimToNull(request.getFullName()));
        }
        if (trimToNull(request.getPhone()) != null) {
            customer.setPhone(trimToNull(request.getPhone()));
        }
        return customer;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
