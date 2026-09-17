-- Chuyển cột nội dung đổi/đổi hàng sang Unicode cho database hiện có.
-- ALTER COLUMN giữ nguyên dữ liệu hiện tại; các giá trị mới sẽ lưu đúng tiếng Việt.

IF OBJECT_ID(N'dbo.return_items', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.return_items', N'reason') IS NOT NULL
BEGIN
    ALTER TABLE dbo.return_items
        ALTER COLUMN reason NVARCHAR(MAX) NULL;
END;
