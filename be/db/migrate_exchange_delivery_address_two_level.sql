-- Đồng bộ địa chỉ phiếu giao đổi cũ theo form địa chỉ hai cấp:
-- địa chỉ cụ thể, phường/xã, tỉnh/thành phố.
UPDATE d
SET d.delivery_address = CONCAT_WS(', ', oa.detail_address, oa.ward, oa.province),
    d.updated_at = SYSDATETIME()
FROM exchange_deliveries d
JOIN return_requests rr ON rr.return_id = d.return_id
JOIN order_address oa ON oa.order_id = rr.order_id;
