SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.product_variants', N'U') IS NULL
        THROW 50001, 'Table dbo.product_variants does not exist.', 1;

    IF COL_LENGTH(N'dbo.product_variants', N'version') IS NULL
    BEGIN
        ALTER TABLE dbo.product_variants
            ADD version BIGINT NOT NULL
                CONSTRAINT DF_product_variants_version DEFAULT (0) WITH VALUES;
    END
    ELSE
    BEGIN
        UPDATE dbo.product_variants SET version = 0 WHERE version IS NULL;

        IF NOT EXISTS (
            SELECT 1
            FROM sys.default_constraints dc
            JOIN sys.columns c
              ON c.object_id = dc.parent_object_id
             AND c.column_id = dc.parent_column_id
            WHERE dc.parent_object_id = OBJECT_ID(N'dbo.product_variants')
              AND c.name = N'version'
        )
        BEGIN
            ALTER TABLE dbo.product_variants
                ADD CONSTRAINT DF_product_variants_version DEFAULT (0) FOR version;
        END;

        ALTER TABLE dbo.product_variants ALTER COLUMN version BIGINT NOT NULL;
    END;

    IF OBJECT_ID(N'dbo.return_requests', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH(N'dbo.return_requests', N'version') IS NULL
        BEGIN
            ALTER TABLE dbo.return_requests
                ADD version BIGINT NOT NULL
                    CONSTRAINT DF_return_requests_version DEFAULT (0) WITH VALUES;
        END
        ELSE
        BEGIN
            UPDATE dbo.return_requests SET version = 0 WHERE version IS NULL;

            IF NOT EXISTS (
                SELECT 1
                FROM sys.default_constraints dc
                JOIN sys.columns c
                  ON c.object_id = dc.parent_object_id
                 AND c.column_id = dc.parent_column_id
                WHERE dc.parent_object_id = OBJECT_ID(N'dbo.return_requests')
                  AND c.name = N'version'
            )
            BEGIN
                ALTER TABLE dbo.return_requests
                    ADD CONSTRAINT DF_return_requests_version DEFAULT (0) FOR version;
            END;

            ALTER TABLE dbo.return_requests ALTER COLUMN version BIGINT NOT NULL;
        END;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
