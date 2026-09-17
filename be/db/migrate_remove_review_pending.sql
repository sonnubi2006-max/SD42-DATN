UPDATE reviews
SET status = N'APPROVED'
WHERE status = N'PENDING';

DECLARE @constraint_name NVARCHAR(128);

SELECT @constraint_name = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c
  ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID(N'reviews')
  AND c.name = N'status';

IF @constraint_name IS NOT NULL
BEGIN
    EXEC(N'ALTER TABLE reviews DROP CONSTRAINT [' + @constraint_name + N']');
END;

ALTER TABLE reviews
ADD CONSTRAINT DF_reviews_status DEFAULT N'APPROVED' FOR status;
