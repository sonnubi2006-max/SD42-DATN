package com.base.config;

import com.base.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class OrderStatusConstraintMigration implements CommandLineRunner {

    private static final List<ConstraintTarget> TARGETS = List.of(
            new ConstraintTarget("dbo.orders", "order_status", "CK_orders_order_status"),
            new ConstraintTarget(
                    "dbo.order_transaction_logs",
                    "previous_status",
                    "CK_order_transaction_logs_previous_status"
            ),
            new ConstraintTarget(
                    "dbo.order_transaction_logs",
                    "current_status",
                    "CK_order_transaction_logs_current_status"
            )
    );

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        TARGETS.forEach(this::migrateConstraint);
    }

    private void migrateConstraint(ConstraintTarget target) {
        Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE object_id = OBJECT_ID(N'"
                        + target.tableName() + "')",
                Integer.class
        );
        if (tableExists == null || tableExists == 0) {
            log.debug(
                    "Skip order status constraint migration because table {} does not exist",
                    target.tableName()
            );
            return;
        }

        String constraintQuery = """
                SELECT cc.name, cc.definition
                FROM sys.check_constraints cc
                WHERE cc.parent_object_id = OBJECT_ID(N'%s')
                  AND (
                      cc.parent_column_id = COLUMNPROPERTY(
                          OBJECT_ID(N'%s'), N'%s', 'ColumnId'
                      )
                      OR cc.definition LIKE N'%%%s%%'
                  )
                """.formatted(
                target.tableName(),
                target.tableName(),
                target.columnName(),
                target.columnName()
        );
        List<Map<String, Object>> constraints = jdbcTemplate.queryForList(constraintQuery);

        boolean allConstraintsSupportEveryStatus = !constraints.isEmpty()
                && constraints.stream().allMatch(this::supportsEveryStatus);
        if (allConstraintsSupportEveryStatus) {
            return;
        }

        for (Map<String, Object> constraint : constraints) {
            String name = String.valueOf(constraint.get("name"));
            jdbcTemplate.execute("ALTER TABLE " + target.tableName()
                    + " DROP CONSTRAINT " + quoteIdentifier(name));
        }

        String allowedStatuses = Arrays.stream(OrderStatus.values())
                .map(status -> "N'" + status.name() + "'")
                .collect(Collectors.joining(", "));

        jdbcTemplate.execute("ALTER TABLE " + target.tableName()
                + " WITH CHECK ADD CONSTRAINT " + quoteIdentifier(target.constraintName())
                + " CHECK (" + quoteIdentifier(target.columnName())
                + " IN (" + allowedStatuses + "))");
        jdbcTemplate.execute("ALTER TABLE " + target.tableName()
                + " CHECK CONSTRAINT " + quoteIdentifier(target.constraintName()));

        log.info(
                "Updated {} to support all OrderStatus values",
                target.constraintName()
        );
    }

    private boolean supportsEveryStatus(Map<String, Object> constraint) {
        Object definition = constraint.get("definition");
        if (definition == null) {
            return false;
        }
        String normalizedDefinition = definition.toString().toUpperCase();
        return Arrays.stream(OrderStatus.values())
                .allMatch(status -> normalizedDefinition.contains(status.name()));
    }

    private String quoteIdentifier(String identifier) {
        return "[" + identifier.replace("]", "]]") + "]";
    }

    private record ConstraintTarget(String tableName, String columnName, String constraintName) {
    }
}
