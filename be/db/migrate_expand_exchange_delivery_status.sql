IF OBJECT_ID('exchange_deliveries', 'U') IS NOT NULL
BEGIN
    DECLARE @status_constraint SYSNAME;
    SELECT TOP (1) @status_constraint = cc.name
    FROM sys.check_constraints cc
    JOIN sys.columns c
      ON c.object_id = cc.parent_object_id
     AND c.column_id = cc.parent_column_id
    WHERE cc.parent_object_id = OBJECT_ID('dbo.exchange_deliveries')
      AND c.name = 'status';

    IF @status_constraint IS NOT NULL
    BEGIN
        DECLARE @drop_status_constraint_sql NVARCHAR(500);
        SET @drop_status_constraint_sql = N'ALTER TABLE dbo.exchange_deliveries DROP CONSTRAINT '
            + QUOTENAME(@status_constraint);
        EXEC sys.sp_executesql @drop_status_constraint_sql;
    END;

    UPDATE exchange_deliveries SET status = 'FAILED_DELIVERY' WHERE status = 'FAILED';

    IF OBJECT_ID('ck_exchange_deliveries_status', 'C') IS NULL
        ALTER TABLE exchange_deliveries ADD CONSTRAINT ck_exchange_deliveries_status CHECK (status IN (
            'PREPARING', 'SHIPPING', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNING',
            'RETURNED_TO_SHOP', 'CANCELLED', 'CANCELED_BY_DAMAGED', 'FAILED'
        ));

    IF COL_LENGTH('exchange_deliveries', 'returned_at') IS NULL
        ALTER TABLE exchange_deliveries ADD returned_at DATETIME2 NULL;

    IF COL_LENGTH('exchange_deliveries', 'cancelled_at') IS NULL
        ALTER TABLE exchange_deliveries ADD cancelled_at DATETIME2 NULL;

    IF COL_LENGTH('exchange_deliveries', 'inventory_restored') IS NULL
        ALTER TABLE exchange_deliveries ADD inventory_restored BIT NOT NULL
            CONSTRAINT df_exchange_deliveries_inventory_restored DEFAULT 0;
END;

IF OBJECT_ID('exchange_delivery_logs', 'U') IS NULL
BEGIN
    CREATE TABLE exchange_delivery_logs (
        log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        exchange_delivery_id BIGINT NOT NULL,
        previous_status VARCHAR(30) NULL,
        current_status VARCHAR(30) NOT NULL,
        note NVARCHAR(MAX) NULL,
        created_by_id BIGINT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_exchange_delivery_log_delivery FOREIGN KEY (exchange_delivery_id)
            REFERENCES exchange_deliveries(exchange_delivery_id),
        CONSTRAINT fk_exchange_delivery_log_user FOREIGN KEY (created_by_id)
            REFERENCES users(user_id)
    );
    CREATE INDEX idx_exchange_delivery_logs_delivery
        ON exchange_delivery_logs(exchange_delivery_id, created_at);
END;

IF OBJECT_ID('exchange_delivery_log_images', 'U') IS NULL
BEGIN
    CREATE TABLE exchange_delivery_log_images (
        image_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        log_id BIGINT NOT NULL,
        image_url VARCHAR(1000) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT fk_exchange_delivery_log_image_log FOREIGN KEY (log_id)
            REFERENCES exchange_delivery_logs(log_id) ON DELETE CASCADE
    );
    CREATE INDEX idx_exchange_delivery_log_images_log
        ON exchange_delivery_log_images(log_id, created_at);
END;
