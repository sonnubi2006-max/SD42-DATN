UPDATE users
SET gender = N'MALE'
WHERE gender IS NULL OR gender NOT IN (N'MALE', N'FEMALE');

DECLARE @defaultConstraint NVARCHAR(255);
SELECT @defaultConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID(N'users')
  AND c.name = N'gender';

IF @defaultConstraint IS NOT NULL
    EXEC(N'ALTER TABLE users DROP CONSTRAINT [' + @defaultConstraint + N']');

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'users')
      AND name = N'CK_users_gender'
)
    ALTER TABLE users DROP CONSTRAINT CK_users_gender;

ALTER TABLE users ALTER COLUMN gender NVARCHAR(255) NOT NULL;
ALTER TABLE users ADD CONSTRAINT DF_users_gender DEFAULT N'MALE' FOR gender;
ALTER TABLE users ADD CONSTRAINT CK_users_gender CHECK (gender IN (N'MALE', N'FEMALE'));
