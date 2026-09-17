package com.base.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderCompletionTimestampMigrationTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void backfillsFromCompletedTransitionAndCreatesIndex() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);
        when(jdbcTemplate.update(anyString())).thenReturn(2);

        new OrderCompletionTimestampMigration(jdbcTemplate).run();

        ArgumentCaptor<String> updateSql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).update(updateSql.capture());
        assertTrue(updateSql.getValue().contains("current_status = 'COMPLETED'"));
        assertTrue(updateSql.getValue().contains("SET completed_at"));

        ArgumentCaptor<String> indexSql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).execute(indexSql.capture());
        assertTrue(indexSql.getValue().contains("IX_orders_completed_at"));
    }
}
