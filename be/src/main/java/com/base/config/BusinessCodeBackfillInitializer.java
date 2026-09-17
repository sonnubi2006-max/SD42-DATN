package com.base.config;

import com.base.entity.Customer;
import com.base.entity.Promotion;
import com.base.entity.User;
import com.base.repository.CustomerRepository;
import com.base.repository.PromotionRepository;
import com.base.repository.UserRepository;
import com.base.utils.BusinessCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class BusinessCodeBackfillInitializer implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PromotionRepository promotionRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        int customers = backfillCustomers();
        int users = backfillUsers();
        int promotions = backfillPromotions();

        if (customers + users + promotions > 0) {
            log.info("Đã bổ sung mã quản lý cho {} khách hàng, {} nhân viên và {} đợt giảm giá",
                    customers, users, promotions);
        }
        ensureUniqueIndex("dbo.customers", "customer_code", "UX_customers_customer_code");
        ensureUniqueIndex("dbo.users", "user_code", "UX_users_user_code");
        ensureUniqueIndex("dbo.promotions", "promotion_code", "UX_promotions_promotion_code");
    }

    private int backfillCustomers() {
        List<Customer> missing = customerRepository.findAll().stream()
                .filter(customer -> isBlank(customer.getCustomerCode()))
                .toList();
        missing.forEach(customer -> customer.setCustomerCode(nextCustomerCode()));
        customerRepository.saveAll(missing);
        customerRepository.flush();
        return missing.size();
    }

    private int backfillUsers() {
        List<User> missing = userRepository.findAll().stream()
                .filter(user -> isBlank(user.getUserCode()))
                .toList();
        missing.forEach(user -> user.setUserCode(nextUserCode()));
        userRepository.saveAll(missing);
        userRepository.flush();
        return missing.size();
    }

    private int backfillPromotions() {
        List<Promotion> missing = promotionRepository.findAll().stream()
                .filter(promotion -> isBlank(promotion.getPromotionCode()))
                .toList();
        missing.forEach(promotion -> promotion.setPromotionCode(nextPromotionCode()));
        promotionRepository.saveAll(missing);
        promotionRepository.flush();
        return missing.size();
    }

    private String nextCustomerCode() {
        String code;
        do {
            code = BusinessCodeGenerator.generate("CUS");
        } while (customerRepository.existsByCustomerCode(code));
        return code;
    }

    private String nextUserCode() {
        String code;
        do {
            code = BusinessCodeGenerator.generate("USR");
        } while (userRepository.existsByUserCode(code));
        return code;
    }

    private String nextPromotionCode() {
        String code;
        do {
            code = BusinessCodeGenerator.generate("PROM");
        } while (promotionRepository.existsByPromotionCode(code));
        return code;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void ensureUniqueIndex(String table, String column, String indexName) {
        String sql = """
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes i
                    JOIN sys.index_columns ic
                      ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                    JOIN sys.columns c
                      ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                    WHERE i.object_id = OBJECT_ID('%s')
                      AND i.is_unique = 1
                      AND c.name = '%s'
                )
                    CREATE UNIQUE INDEX [%s] ON %s([%s]) WHERE [%s] IS NOT NULL
                """.formatted(table, column, indexName, table, column, column);
        jdbcTemplate.execute(sql);
    }
}
