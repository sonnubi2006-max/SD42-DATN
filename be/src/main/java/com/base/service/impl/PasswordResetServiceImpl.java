package com.base.service.impl;

import com.base.dto.event.EmailMessage;
import com.base.entity.Customer;
import com.base.entity.PasswordResetToken;
import com.base.entity.User;
import com.base.enums.AccountType;
import com.base.enums.EmailType;
import com.base.exception.BadRequestException;
import com.base.queue.EmailProducer;
import com.base.repository.CustomerRepository;
import com.base.repository.PasswordResetTokenRepository;
import com.base.repository.UserRepository;
import com.base.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailProducer emailProducer;

    @Value("${app.password-reset.expiration-minutes}")
    private long expirationMinutes;

    @Value("${app.frontend.admin-url}")
    private String adminUrl;

    @Value("${app.frontend.customer-url}")
    private String customerUrl;

    @Override
    @Transactional
    public void requestReset(String email, AccountType accountType) {

        String recipientName = findRecipientName(email, accountType);
        if (recipientName == null) {
            String accountLabel = accountType == AccountType.USER
                    ? "nhân viên"
                    : "khách hàng";
            log.info("Yêu cầu reset cho email không tồn tại: {} ({})", email, accountType);
            throw new BadRequestException(
                    "Email không tồn tại trong danh sách tài khoản " + accountLabel
            );
        }

        tokenRepository.deleteByEmailAndAccountType(email, accountType);

        String token = UUID.randomUUID().toString();

        tokenRepository.save(PasswordResetToken.builder()
                .token(token)
                .email(email)
                .accountType(accountType)
                .expiryDate(Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES))
                .used(false)
                .build());

        String resetUrl = buildResetUrl(accountType, token);

        emailProducer.send(EmailMessage.builder()
                .to(email)
                .recipientName(recipientName)
                .type(EmailType.FORGOT_PASSWORD)
                .data(Map.of(
                        "resetUrl", resetUrl,
                        "expirationMinutes", expirationMinutes
                ))
                .build());

        log.info("Đã tạo token reset mật khẩu cho {} ({})", email, accountType);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword, String confirmPassword) {

        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("Mật khẩu mới tối thiểu 6 ký tự");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp");
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Token không hợp lệ"));

        if (!resetToken.isUsable()) {
            throw new BadRequestException("Token đã hết hạn hoặc đã được sử dụng");
        }

        String encoded = passwordEncoder.encode(newPassword);

        if (resetToken.getAccountType() == AccountType.USER) {
            User user = userRepository.findByEmail(resetToken.getEmail())
                    .orElseThrow(() -> new BadRequestException("Tài khoản không tồn tại"));
            user.setPassword(encoded);
            userRepository.save(user);
        } else {
            Customer customer = customerRepository.findByEmail(resetToken.getEmail())
                    .orElseThrow(() -> new BadRequestException("Tài khoản không tồn tại"));
            customer.setPassword(encoded);
            customerRepository.save(customer);
        }

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Đã đặt lại mật khẩu cho {} ({})",
                resetToken.getEmail(), resetToken.getAccountType());
    }

    private String findRecipientName(String email, AccountType accountType) {
        if (accountType == AccountType.USER) {
            return userRepository.findByEmail(email)
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                    .orElse(null);
        }
        return customerRepository.findByEmail(email)
                .map(c -> c.getFullName() != null ? c.getFullName() : c.getEmail())
                .orElse(null);
    }

    private String buildResetUrl(AccountType accountType, String token) {
        String base = accountType == AccountType.USER ? adminUrl : customerUrl;
        return base + "/reset-password?token=" + token;
    }
}
