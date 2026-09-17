package com.base.controller;

import com.base.dto.request.brand.CreateBrandRequest;
import com.base.dto.request.brand.UpdateBrandRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.brand.BrandStatisticProjection;
import com.base.entity.Brand;
import com.base.enums.BrandStatus;
import com.base.service.BrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.base.excels.BrandExcelExporter;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class BrandController {
    private final BrandService brandService;

    @GetMapping("/brand")
    public ResponseEntity<ApiResponse<Page<Brand>>> getAllCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "brandId") String sort,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BrandStatus status,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction sortDirection = direction.equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sortBy = Sort.by(sortDirection, sort);
        Pageable pageable = PageRequest.of(page, size, sortBy);
        return ResponseEntity.ok(ApiResponse.success(brandService.getBrands(status, keyword, pageable)));
    }

    @GetMapping("/brand/{id}")
    public ResponseEntity<ApiResponse<Brand>> getBrand(@PathVariable Long id) {
        Brand brand = brandService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(brand));
    }

    @PostMapping("/admin/brand")
    public ResponseEntity<ApiResponse<Brand>> createBrand(
            @Valid @ModelAttribute CreateBrandRequest brand
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body((ApiResponse.success(brandService.save(brand, brand.getFile()))));
    }

    @PutMapping("/admin/brand/{id}")
    public ResponseEntity<ApiResponse<Brand>> updateBrand(
            @PathVariable Long id,
            @ModelAttribute UpdateBrandRequest brand,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok((ApiResponse.success(brandService.update(id, brand, file))));
    }

    @DeleteMapping("/admin/brand/{id}")
    public ResponseEntity<ApiResponse<?>> createBrand(@PathVariable Long id) {
        brandService.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/brand/statistics")
    public ResponseEntity<ApiResponse<BrandStatisticProjection>> getBrandStatistics() {
        return ResponseEntity.ok(ApiResponse.success(brandService.getBrandStatistics()));
    }

    @GetMapping("/admin/brand/export/excel")
    public void exportToExcel(
            HttpServletResponse response,
            @RequestParam(required = false) BrandStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<Long> ids
    ) throws IOException {
        List<Brand> brandList = brandService.exportBrands(status, keyword, ids);

        response.setContentType("application/octet-stream");

        DateFormat dateFormatter =
                new SimpleDateFormat("yyyy-MM-dd_HH:mm:ss");

        String currentDateTime =
                dateFormatter.format(new Date());

        String headerKey = "Content-Disposition";
        String headerValue =
                "attachment; filename=brands_"
                        + currentDateTime
                        + ".xlsx";

        response.setHeader(headerKey, headerValue);

        BrandExcelExporter excelExporter =
                new BrandExcelExporter(brandList);

        excelExporter.export(response);
    }
}
