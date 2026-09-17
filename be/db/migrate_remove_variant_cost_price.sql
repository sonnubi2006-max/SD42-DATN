DECLARE @constraint_name NVARCHAR(128);

SELECT @constraint_name = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID(N'product_variants')
  AND c.name = N'cost_price';

IF @constraint_name IS NOT NULL
BEGIN
    EXEC(N'ALTER TABLE product_variants DROP CONSTRAINT [' + @constraint_name + N']');
END;

IF COL_LENGTH(N'product_variants', N'cost_price') IS NOT NULL
BEGIN
    ALTER TABLE product_variants DROP COLUMN cost_price;
END;
