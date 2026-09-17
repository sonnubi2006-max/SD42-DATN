SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.payments', N'U') IS NULL
        THROW 50001, 'Table dbo.payments does not exist.', 1;

    IF COL_LENGTH(N'dbo.payments', N'refunded_amount') IS NULL
    BEGIN
        ALTER TABLE dbo.payments
            ADD refunded_amount DECIMAL(15,2) NOT NULL
                CONSTRAINT DF_payments_refunded_amount DEFAULT (0) WITH VALUES;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
