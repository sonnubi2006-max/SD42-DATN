package com.base.dto.response.brand;

import lombok.Data;

@Data
public class BrandResponse {
    private Long brandId;
    private String brandLogo;
    private String brandName;
    private String brandCode;
}
