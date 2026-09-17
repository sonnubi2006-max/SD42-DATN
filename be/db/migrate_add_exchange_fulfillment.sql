IF COL_LENGTH('return_requests', 'exchange_fulfillment_method') IS NULL
BEGIN
    ALTER TABLE return_requests ADD exchange_fulfillment_method VARCHAR(30) NULL;
END;

IF COL_LENGTH('return_requests', 'exchange_receiver_name') IS NULL
BEGIN
    ALTER TABLE return_requests ADD exchange_receiver_name NVARCHAR(100) NULL;
END;

IF COL_LENGTH('return_requests', 'exchange_receiver_phone') IS NULL
BEGIN
    ALTER TABLE return_requests ADD exchange_receiver_phone VARCHAR(20) NULL;
END;

IF COL_LENGTH('return_requests', 'exchange_delivery_address') IS NULL
BEGIN
    ALTER TABLE return_requests ADD exchange_delivery_address NVARCHAR(500) NULL;
END;

IF COL_LENGTH('return_requests', 'exchange_shipping_fee') IS NULL
BEGIN
    ALTER TABLE return_requests ADD exchange_shipping_fee DECIMAL(15,2) NULL;
END;

IF COL_LENGTH('exchange_deliveries', 'fulfillment_method') IS NULL
BEGIN
    ALTER TABLE exchange_deliveries ADD fulfillment_method VARCHAR(30) NOT NULL
        CONSTRAINT df_exchange_deliveries_fulfillment DEFAULT 'DELIVERY';
END;

UPDATE rr
SET exchange_fulfillment_method = COALESCE(rr.exchange_fulfillment_method, 'DELIVERY'),
    exchange_receiver_name = COALESCE(rr.exchange_receiver_name, d.receiver_name),
    exchange_receiver_phone = COALESCE(rr.exchange_receiver_phone, d.receiver_phone),
    exchange_delivery_address = COALESCE(rr.exchange_delivery_address, d.delivery_address),
    exchange_shipping_fee = COALESCE(rr.exchange_shipping_fee, d.shipping_fee, 0)
FROM return_requests rr
LEFT JOIN exchange_deliveries d ON d.return_id = rr.return_id
WHERE rr.return_type = 'EXCHANGE';
