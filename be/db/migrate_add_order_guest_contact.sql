IF COL_LENGTH('dbo.orders', 'guest_name') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD guest_name NVARCHAR(100) NULL;
END;

IF COL_LENGTH('dbo.orders', 'guest_email') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD guest_email NVARCHAR(254) NULL;
END;

IF COL_LENGTH('dbo.orders', 'guest_phone') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD guest_phone NVARCHAR(20) NULL;
END;
