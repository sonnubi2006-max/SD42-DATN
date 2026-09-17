package com.base.dto.response.brand;

public interface BrandStatisticProjection {
    Long getTotalBrands();

    Long getActiveBrands();

    Long getInactiveBrands();
}
