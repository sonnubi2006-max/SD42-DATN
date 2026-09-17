package com.base.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(20)
@RequiredArgsConstructor
@Slf4j
public class OrderCompletionTimestampMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        Integer columnExists = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM sys.columns
                WHERE object_id = OBJECT_ID(N'dbo.orders')
                  AND name = N'completed_at'
                """, Integer.class);
        if (columnExists == null || columnExists == 0) {
            log.warn("Bỏ qua backfill completed_at vì cột chưa tồn tại");
            return;
        }

        int updated = jdbcTemplate.update("""
                UPDATE o
                SET completed_at = COALESCE(completion.completed_at, o.updated_at, o.order_date, o.created_at)
                FROM dbo.orders o
                OUTER APPLY (
                    SELECT MIN(logs.created_at) AS completed_at
                    FROM dbo.order_transaction_logs logs
                    WHERE logs.order_id = o.order_id
                      AND logs.current_status = 'COMPLETED'
                      AND (logs.previous_status IS NULL OR logs.previous_status <> 'COMPLETED')
                ) completion
                WHERE o.completed_at IS NULL
                  AND o.order_status IN ('COMPLETED', 'REFUNDED')
                """);

        jdbcTemplate.execute("""
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_orders_completed_at'
                      AND object_id = OBJECT_ID(N'dbo.orders')
                )
                    CREATE INDEX IX_orders_completed_at ON dbo.orders(completed_at)
                """);

        if (updated > 0) {
            log.info("Đã bổ sung thời điểm hoàn thành cho {} đơn hàng cũ", updated);
        }
    }
}
