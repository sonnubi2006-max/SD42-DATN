package com.base.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

@Component
@Profile("legacy-migration")
@RequiredArgsConstructor
@Slf4j
public class DbMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Running database migration to drop unused columns from banners table...");
        try {

            Integer positionColExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('banners') AND name = 'position'", 
                Integer.class
            );
            if (positionColExists != null && positionColExists > 0) {
                log.info("Dropping column 'position' from banners table...");
                jdbcTemplate.execute("ALTER TABLE banners DROP COLUMN position");
            }

            Integer orderColExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('banners') AND name = 'display_order'", 
                Integer.class
            );
            if (orderColExists != null && orderColExists > 0) {
                log.info("Dropping column 'display_order' from banners table...");
                jdbcTemplate.execute("ALTER TABLE banners DROP COLUMN display_order");
            }
            log.info("Database migration completed successfully.");
        } catch (Exception e) {
            log.error("Failed to drop unused columns from banners table: {}", e.getMessage(), e);
        }
    }
}
