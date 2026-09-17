-- Move legacy comma-separated evidence URLs to the normalized image table before dropping the old column.
IF OBJECT_ID('dbo.exchange_delivery_logs', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.exchange_delivery_log_images', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.exchange_delivery_logs', 'evidence_images') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        INSERT INTO dbo.exchange_delivery_log_images (log_id, image_url, created_at)
        SELECT logs.log_id,
               LTRIM(RTRIM(images.value)),
               COALESCE(logs.created_at, SYSDATETIME())
        FROM dbo.exchange_delivery_logs logs
        CROSS APPLY STRING_SPLIT(logs.evidence_images, '','') images
        WHERE LTRIM(RTRIM(images.value)) <> ''''
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.exchange_delivery_log_images existing
              WHERE existing.log_id = logs.log_id
                AND existing.image_url = LTRIM(RTRIM(images.value))
          );

        ALTER TABLE dbo.exchange_delivery_logs DROP COLUMN evidence_images;
    ';
END;

IF OBJECT_ID('dbo.exchange_deliveries', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.exchange_deliveries', 'carrier') IS NOT NULL
BEGIN
    ALTER TABLE dbo.exchange_deliveries DROP COLUMN carrier;
END;

IF OBJECT_ID('dbo.exchange_deliveries', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.exchange_deliveries', 'tracking_code') IS NOT NULL
BEGIN
    ALTER TABLE dbo.exchange_deliveries DROP COLUMN tracking_code;
END;
