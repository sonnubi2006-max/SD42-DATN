IF COL_LENGTH('dbo.addresses', 'ghn_province_id') IS NULL
    ALTER TABLE dbo.addresses ADD ghn_province_id INT NULL;

IF COL_LENGTH('dbo.addresses', 'ghn_district_id') IS NULL
    ALTER TABLE dbo.addresses ADD ghn_district_id INT NULL;

IF COL_LENGTH('dbo.addresses', 'ghn_ward_code') IS NULL
    ALTER TABLE dbo.addresses ADD ghn_ward_code NVARCHAR(20) NULL;
