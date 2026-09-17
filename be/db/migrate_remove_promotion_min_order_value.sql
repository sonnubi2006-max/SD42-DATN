-- Giá trị đơn tối thiểu chỉ còn là điều kiện của coupon, không còn thuộc promotion.

IF OBJECT_ID(N'dbo.promotions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.promotions', N'min_order_value') IS NOT NULL
BEGIN
    ALTER TABLE dbo.promotions DROP COLUMN min_order_value;
END;
