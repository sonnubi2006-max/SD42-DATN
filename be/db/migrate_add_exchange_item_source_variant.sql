IF COL_LENGTH('exchange_items', 'source_variant_id') IS NULL
BEGIN
    ALTER TABLE exchange_items ADD source_variant_id BIGINT NULL;
    ALTER TABLE exchange_items ADD CONSTRAINT fk_exchange_item_source_variant
        FOREIGN KEY (source_variant_id) REFERENCES product_variants(variant_id);
    CREATE INDEX idx_exchange_items_source_variant ON exchange_items(source_variant_id);
END;

-- Dữ liệu cũ được gán tự động khi phiếu chỉ trả một biến thể cùng sản phẩm.
UPDATE ei
SET source_variant_id = matched.source_variant_id
FROM exchange_items ei
CROSS APPLY (
    SELECT MIN(ri.variant_id) AS source_variant_id, COUNT(DISTINCT ri.variant_id) AS variant_count
    FROM return_items ri
    JOIN product_variants source_variant ON source_variant.variant_id = ri.variant_id
    JOIN product_variants replacement_variant ON replacement_variant.variant_id = ei.new_variant_id
    WHERE ri.return_id = ei.return_id
      AND source_variant.product_id = replacement_variant.product_id
) matched
WHERE ei.source_variant_id IS NULL AND matched.variant_count = 1;
