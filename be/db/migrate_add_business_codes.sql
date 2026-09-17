-- SQL Server migration for existing databases.
-- New records receive codes automatically from the application.

IF COL_LENGTH('dbo.customers', 'customer_code') IS NULL
    ALTER TABLE dbo.customers ADD customer_code VARCHAR(20) NULL;

IF COL_LENGTH('dbo.users', 'user_code') IS NULL
    ALTER TABLE dbo.users ADD user_code VARCHAR(20) NULL;

IF COL_LENGTH('dbo.promotions', 'promotion_code') IS NULL
    ALTER TABLE dbo.promotions ADD promotion_code VARCHAR(20) NULL;

UPDATE dbo.customers
SET customer_code = 'CUS_' + UPPER(LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 8))
WHERE customer_code IS NULL OR LTRIM(RTRIM(customer_code)) = '';

UPDATE dbo.users
SET user_code = 'USR_' + UPPER(LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 8))
WHERE user_code IS NULL OR LTRIM(RTRIM(user_code)) = '';

UPDATE dbo.promotions
SET promotion_code = 'PROM_' + UPPER(LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 8))
WHERE promotion_code IS NULL OR LTRIM(RTRIM(promotion_code)) = '';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_customers_customer_code'
               AND object_id = OBJECT_ID('dbo.customers'))
    CREATE UNIQUE INDEX UX_customers_customer_code
        ON dbo.customers(customer_code) WHERE customer_code IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_users_user_code'
               AND object_id = OBJECT_ID('dbo.users'))
    CREATE UNIQUE INDEX UX_users_user_code
        ON dbo.users(user_code) WHERE user_code IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_promotions_promotion_code'
               AND object_id = OBJECT_ID('dbo.promotions'))
    CREATE UNIQUE INDEX UX_promotions_promotion_code
        ON dbo.promotions(promotion_code) WHERE promotion_code IS NOT NULL;
