IF COL_LENGTH('return_requests', 'customer_id') IS NULL
BEGIN
    ALTER TABLE return_requests ADD customer_id BIGINT NULL;
END;
GO

UPDATE rr
SET customer_id = o.customer_id
FROM return_requests rr
JOIN orders o ON o.order_id = rr.order_id
WHERE rr.customer_id IS NULL
  AND o.customer_id IS NOT NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'fk_return_requests_customer'
)
BEGIN
    ALTER TABLE return_requests
        ADD CONSTRAINT fk_return_requests_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ix_return_requests_customer_id'
      AND object_id = OBJECT_ID('return_requests')
)
BEGIN
    CREATE INDEX ix_return_requests_customer_id
        ON return_requests(customer_id);
END;
