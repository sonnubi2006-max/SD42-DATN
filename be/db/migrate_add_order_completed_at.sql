-- Ghi nhận doanh thu theo thời điểm đơn chuyển sang COMPLETED.

IF COL_LENGTH('dbo.orders', 'completed_at') IS NULL
    ALTER TABLE dbo.orders ADD completed_at DATETIME2(6) NULL;

UPDATE o
SET completed_at = COALESCE(completion.completed_at, o.updated_at, o.order_date, o.created_at)
FROM dbo.orders o
OUTER APPLY (
    SELECT MIN(logs.created_at) AS completed_at
    FROM dbo.order_transaction_logs logs
    WHERE logs.order_id = o.order_id
      AND logs.current_status = 'COMPLETED'
      AND (logs.previous_status IS NULL OR logs.previous_status <> 'COMPLETED')
) completion
WHERE o.completed_at IS NULL
  AND o.order_status IN ('COMPLETED', 'REFUNDED');

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_orders_completed_at'
      AND object_id = OBJECT_ID(N'dbo.orders')
)
    CREATE INDEX IX_orders_completed_at ON dbo.orders(completed_at);
