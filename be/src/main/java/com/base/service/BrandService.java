package com.base.service;

import com.base.dto.request.brand.CreateBrandRequest;
import com.base.dto.request.brand.UpdateBrandRequest;
import com.base.dto.response.brand.BrandStatisticProjection;
import com.base.entity.Brand;
import com.base.enums.BrandStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BrandService {
    Page<Brand> getBrands(BrandStatus status, String keyword, Pageable pageable);
    Brand save(CreateBrandRequest brand, MultipartFile file);
    Brand update(Long id, UpdateBrandRequest brand, MultipartFile file);
    void delete(Long id);
    Brand findById(Long id);
    BrandStatisticProjection getBrandStatistics();
    List<Brand> exportBrands(BrandStatus status, String keyword, List<Long> ids);
}