UPDATE customers
SET gender = N'MALE'
WHERE gender IS NULL OR gender NOT IN (N'MALE', N'FEMALE');

DECLARE @default_constraint NVARCHAR(128);

SELECT @default_constraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID(N'customers')
  AND c.name = N'gender';

IF @default_constraint IS NOT NULL
BEGIN
    EXEC(N'ALTER TABLE customers DROP CONSTRAINT [' + @default_constraint + N']');
END;

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'customers')
      AND name = N'CK_customers_gender'
)
BEGIN
    ALTER TABLE customers DROP CONSTRAINT CK_customers_gender;
END;

ALTER TABLE customers ALTER COLUMN gender NVARCHAR(255) NOT NULL;
ALTER TABLE customers ADD CONSTRAINT DF_customers_gender DEFAULT N'MALE' FOR gender;
ALTER TABLE customers ADD CONSTRAINT CK_customers_gender CHECK (gender IN (N'MALE', N'FEMALE'));
