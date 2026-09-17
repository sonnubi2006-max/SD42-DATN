package com.base.config;

import com.base.entity.Customer;
import com.base.entity.User;
import com.base.enums.RoleUser;
import com.base.repository.CustomerRepository;
import com.base.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.default-password}")
    private String defaultPassword;

    @Override
    public void run(String... args) {
        if (defaultPassword == null || defaultPassword.isBlank()) {
            log.warn("Bỏ qua seed tài khoản mẫu vì app.seed.default-password chưa được cấu hình");
            return;
        }
        boolean seeded = false;
        if (!userRepository.existsByEmail("admin@example.com")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@example.com")
                    .phone("0987654321")
                    .password(passwordEncoder.encode(defaultPassword))
                    .role(RoleUser.ADMIN)
                    .build();

            userRepository.save(admin);
            seeded = true;
        }

        if (!userRepository.existsByEmail("staff@example.com")) {
            User staff = User.builder()
                    .username("staff")
                    .phone("0987654322")
                    .email("staff@example.com")
                    .password(passwordEncoder.encode(defaultPassword))
                    .role(RoleUser.STAFF)
                    .build();

            userRepository.save(staff);
            seeded = true;
        }

        if (!customerRepository.existsByEmail("user@example.com")) {
            Customer user = Customer.builder()
                    .phone("0987654323")
                    .email("user@example.com")
                    .fullName("Khách Mẫu")
                    .password(passwordEncoder.encode(defaultPassword))
                    .build();

            customerRepository.save(user);
            seeded = true;
        }

        if (seeded) {
            log.info("Đã seed các tài khoản mẫu còn thiếu");
        } else {
            log.info("Các tài khoản mẫu đã tồn tại, không cần seed lại");
        }
    }
}
