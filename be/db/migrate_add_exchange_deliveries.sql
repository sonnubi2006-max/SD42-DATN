IF OBJECT_ID('exchange_deliveries', 'U') IS NULL
BEGIN
    CREATE TABLE exchange_deliveries (
        exchange_delivery_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        version BIGINT NOT NULL DEFAULT 0,
        return_id BIGINT NOT NULL UNIQUE,
        delivery_code VARCHAR(40) NOT NULL UNIQUE,
        status VARCHAR(30) NOT NULL DEFAULT 'PREPARING',
        receiver_name NVARCHAR(100) NOT NULL,
        receiver_phone VARCHAR(20) NOT NULL,
        delivery_address NVARCHAR(500) NULL,
        shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
        note NVARCHAR(MAX) NULL,
        shipped_at DATETIME2 NULL,
        delivered_at DATETIME2 NULL,
        returned_at DATETIME2 NULL,
        cancelled_at DATETIME2 NULL,
        inventory_restored BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NULL,
        CONSTRAINT fk_exchange_delivery_return FOREIGN KEY (return_id) REFERENCES return_requests(return_id)
    );
    CREATE INDEX idx_exchange_deliveries_status ON exchange_deliveries(status);
END;

INSERT INTO exchange_deliveries
    (return_id, delivery_code, status, receiver_name, receiver_phone, delivery_address,
     shipping_fee, delivered_at, created_at, updated_at)
SELECT rr.return_id, CONCAT('DGH-', rr.return_id), 'DELIVERED', rr.customer_name,
       COALESCE(rr.customer_phone, ''),
       CONCAT_WS(', ', oa.detail_address, oa.ward, oa.province),
       0, rr.updated_at, rr.updated_at, rr.updated_at
FROM return_requests rr
LEFT JOIN order_address oa ON oa.order_id = rr.order_id
WHERE rr.return_type = 'EXCHANGE' AND rr.status = 'COMPLETED'
  AND NOT EXISTS (SELECT 1 FROM exchange_deliveries d WHERE d.return_id = rr.return_id);
