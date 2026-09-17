SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @targets TABLE (
        target_id       INT IDENTITY(1,1) PRIMARY KEY,
        table_name      NVARCHAR(255) NOT NULL,
        column_name     SYSNAME NOT NULL,
        constraint_name SYSNAME NOT NULL
    );

    INSERT INTO @targets (table_name, column_name, constraint_name)
    VALUES
        (N'dbo.orders', N'order_status', N'CK_orders_order_status'),
        (
            N'dbo.order_transaction_logs',
            N'previous_status',
            N'CK_order_transaction_logs_previous_status'
        ),
        (
            N'dbo.order_transaction_logs',
            N'current_status',
            N'CK_order_transaction_logs_current_status'
        );

    DECLARE @targetId INT = 1;
    DECLARE @targetCount INT = (SELECT COUNT(*) FROM @targets);
    DECLARE @tableName NVARCHAR(255);
    DECLARE @columnName SYSNAME;
    DECLARE @constraintName SYSNAME;
    DECLARE @objectId INT;
    DECLARE @dropConstraints NVARCHAR(MAX);
    DECLARE @addConstraint NVARCHAR(MAX);

    WHILE @targetId <= @targetCount
    BEGIN
        SELECT
            @tableName = table_name,
            @columnName = column_name,
            @constraintName = constraint_name
        FROM @targets
        WHERE target_id = @targetId;

        SET @objectId = OBJECT_ID(@tableName, N'U');

        IF @objectId IS NOT NULL
           AND COL_LENGTH(@tableName, @columnName) IS NOT NULL
           AND (
               NOT EXISTS (
                   SELECT 1
                   FROM sys.check_constraints cc
                   WHERE cc.parent_object_id = @objectId
                     AND (
                         cc.parent_column_id = COLUMNPROPERTY(
                             @objectId, @columnName, 'ColumnId'
                         )
                         OR cc.definition LIKE N'%' + @columnName + N'%'
                     )
               )
               OR EXISTS (
                   SELECT 1
                   FROM sys.check_constraints cc
                   WHERE cc.parent_object_id = @objectId
                     AND (
                         cc.parent_column_id = COLUMNPROPERTY(
                             @objectId, @columnName, 'ColumnId'
                         )
                         OR cc.definition LIKE N'%' + @columnName + N'%'
                     )
                     AND (
                         UPPER(cc.definition) NOT LIKE N'%PENDING%'
                         OR UPPER(cc.definition) NOT LIKE N'%WAITING_STOCK%'
                     )
               )
           )
        BEGIN
            SET @dropConstraints = N'';

            SELECT @dropConstraints = @dropConstraints
                + N'ALTER TABLE ' + @tableName
                + N' DROP CONSTRAINT ' + QUOTENAME(cc.name) + N';'
            FROM sys.check_constraints cc
            WHERE cc.parent_object_id = @objectId
              AND (
                  cc.parent_column_id = COLUMNPROPERTY(
                      @objectId, @columnName, 'ColumnId'
                  )
                  OR cc.definition LIKE N'%' + @columnName + N'%'
              );

            IF LEN(@dropConstraints) > 0
                EXEC sys.sp_executesql @dropConstraints;

            SET @addConstraint = N'ALTER TABLE ' + @tableName
                + N' WITH CHECK ADD CONSTRAINT ' + QUOTENAME(@constraintName)
                + N' CHECK (' + QUOTENAME(@columnName) + N' IN ('
                + N'N''DRAFT'', N''WAITING_PAYMENT'', N''PENDING'', N''WAITING_STOCK'', N''CONFIRMED'', '
                + N'N''SHIPPING'', N''RETURNING'', N''RETURNED_TO_SHOP'', '
                + N'N''CANCELED_BY_DAMAGED'', N''FAILED_DELIVERY'', N''COMPLETED'', '
                + N'N''CANCELLED'', N''REFUNDED''));'
                + N'ALTER TABLE ' + @tableName
                + N' CHECK CONSTRAINT ' + QUOTENAME(@constraintName) + N';';

            EXEC sys.sp_executesql @addConstraint;
        END;

        SET @targetId += 1;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
