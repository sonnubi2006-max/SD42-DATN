package com.base.config;

import com.base.enums.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.stream.Collectors;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderStatusConstraintMigrationTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private OrderStatusConstraintMigration migration;

    @BeforeEach
    void setUp() {
        migration = new OrderStatusConstraintMigration(jdbcTemplate);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);
    }

    @Test
    void replacesLegacyTransactionLogConstraintThatDoesNotAllowPending() {
        Map<String, Object> supportedConstraint = Map.of(
                "name", "supported_constraint",
                "definition", "([status] IN ('PENDING', 'CONFIRMED'))"
        );
        when(jdbcTemplate.queryForList(contains("order_status")))
                .thenReturn(List.of(supportedConstraint));
        when(jdbcTemplate.queryForList(contains("previous_status")))
                .thenReturn(List.of(supportedConstraint));
        when(jdbcTemplate.queryForList(contains("current_status"))).thenReturn(List.of(Map.of(
                "name", "CK__order_tra__curre__17F790F9",
                "definition", "([current_status]='CONFIRMED' OR [current_status]='DRAFT')"
        )));

        migration.run();

        verify(jdbcTemplate).execute(
                "ALTER TABLE dbo.order_transaction_logs "
                        + "DROP CONSTRAINT [CK__order_tra__curre__17F790F9]"
        );
        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, atLeastOnce()).execute(sqlCaptor.capture());
        assertTrue(sqlCaptor.getAllValues().stream().anyMatch(sql ->
                sql.contains("ADD CONSTRAINT [CK_order_transaction_logs_current_status]")
                        && sql.contains("N'PENDING'")
        ));
    }

    @Test
    void skipsMigrationWhenExistingConstraintAlreadyAllowsEveryStatus() {
        String allowedStatuses = Arrays.stream(OrderStatus.values())
                .map(status -> "'" + status.name() + "'")
                .collect(Collectors.joining(", "));
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(Map.of(
                "name", "CK_orders_order_status",
                "definition", "([order_status] IN (" + allowedStatuses + "))"
        )));

        migration.run();

        verify(jdbcTemplate, never()).execute(anyString());
    }
}
