package com.base.service.helper;

import com.base.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderCodeGenerator {

    private static final String PREFIX = "ORD";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final OrderRepository orderRepository;

    public String generate() {
        String code;
        int attempts = 0;

        do {
            if (attempts++ > 10) {
                throw new IllegalStateException("Không thể sinh mã đơn hàng sau 10 lần thử");
            }
            code = buildCode();
        } while (orderRepository.existsByOrderCode(code));

        return code;
    }

    private String buildCode() {
        String datePart = LocalDateTime.now().format(DATE_FMT);

        String uniquePart = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 6)
                .toUpperCase();
        return PREFIX + "-" + datePart + "-" + uniquePart;
    }
}

