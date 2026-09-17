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

    IF OBJECT_ID(N'dbo.order_details', N'U') IS NULL
        THROW 50001, 'Table dbo.order_details does not exist.', 1;

    IF COL_LENGTH(N'dbo.order_details', N'damaged_quantity') IS NULL
    BEGIN
        ALTER TABLE dbo.order_details
            ADD damaged_quantity INT NOT NULL
                CONSTRAINT DF_order_details_damaged_quantity DEFAULT (0) WITH VALUES;

        EXEC sys.sp_executesql N'
            UPDATE od
               SET od.damaged_quantity = od.quantity
              FROM dbo.order_details od
              JOIN dbo.orders o ON o.order_id = od.order_id
             WHERE o.order_status = N''CANCELED_BY_DAMAGED'';';
    END
    ELSE
    BEGIN
        EXEC sys.sp_executesql N'
            UPDATE od
               SET od.damaged_quantity =
                   CASE WHEN o.order_status = N''CANCELED_BY_DAMAGED''
                        THEN od.quantity ELSE 0 END
              FROM dbo.order_details od
              JOIN dbo.orders o ON o.order_id = od.order_id
             WHERE od.damaged_quantity IS NULL;';

        IF NOT EXISTS (
            SELECT 1
            FROM sys.default_constraints dc
            JOIN sys.columns c
              ON c.object_id = dc.parent_object_id
             AND c.column_id = dc.parent_column_id
            WHERE dc.parent_object_id = OBJECT_ID(N'dbo.order_details')
              AND c.name = N'damaged_quantity'
        )
        BEGIN
            ALTER TABLE dbo.order_details
                ADD CONSTRAINT DF_order_details_damaged_quantity
                    DEFAULT (0) FOR damaged_quantity;
        END;

        EXEC sys.sp_executesql N'
            ALTER TABLE dbo.order_details
                ALTER COLUMN damaged_quantity INT NOT NULL;';
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.order_details')
          AND name = N'CK_order_details_damaged_quantity'
    )
    BEGIN
        EXEC sys.sp_executesql N'
            ALTER TABLE dbo.order_details WITH CHECK
                ADD CONSTRAINT CK_order_details_damaged_quantity
                    CHECK (damaged_quantity >= 0 AND damaged_quantity <= quantity);';
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
