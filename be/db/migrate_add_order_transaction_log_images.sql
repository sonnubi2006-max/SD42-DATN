IF OBJECT_ID(N'dbo.order_transaction_log_images', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_transaction_log_images (
        image_id         BIGINT IDENTITY(1,1) NOT NULL,
        log_id           BIGINT NOT NULL,
        image_url        NVARCHAR(1000) NOT NULL,
        cloud_public_id  NVARCHAR(500) NULL,
        original_name    NVARCHAR(255) NULL,
        content_type     NVARCHAR(100) NULL,
        file_size        BIGINT NULL,
        created_at       DATETIME2(6) NULL
                             CONSTRAINT DF_order_log_images_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_order_transaction_log_images PRIMARY KEY (image_id),
        CONSTRAINT FK_order_log_images_logs
            FOREIGN KEY (log_id) REFERENCES dbo.order_transaction_logs(log_id)
            ON DELETE CASCADE,
        CONSTRAINT CK_order_log_images_file_size
            CHECK (file_size IS NULL OR file_size >= 0)
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_order_transaction_log_images_log_id'
      AND object_id = OBJECT_ID(N'dbo.order_transaction_log_images')
)
BEGIN
    CREATE INDEX IX_order_transaction_log_images_log_id
        ON dbo.order_transaction_log_images(log_id);
END;
