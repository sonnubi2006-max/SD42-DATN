package com.base.controller;

import com.base.dto.request.product.CreateProductRequest;
import com.base.dto.request.product.UpdateProductRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.product.ProductResponse;
import com.base.entity.Product;
import com.base.enums.ProductStatus;
import com.base.excels.ProductExcelExporter;
import com.base.service.ProductService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private final ProductService productService;

    @PostMapping(value = "/admin/products", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @ModelAttribute @Valid CreateProductRequest request,
            @RequestPart("files") List<MultipartFile> files
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(productService.createProduct(request, files)));
    }

    @PutMapping(value = "/admin/products/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable Long id,
            @ModelAttribute @Valid UpdateProductRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.updateProduct(id, request, files)));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getById(id)));
    }

    @GetMapping("/products/code/{productCode}")
    public ResponseEntity<ApiResponse<ProductResponse>> getByCode(@PathVariable String productCode) {
        return ResponseEntity.ok(ApiResponse.success(productService.getByCode(productCode)));
    }

    @GetMapping("/admin/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getByIdAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getByIdAdmin(id)));
    }

    @DeleteMapping("/admin/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/products/{id}/restore")
    public ResponseEntity<ApiResponse<ProductResponse>> restore(@PathVariable Long id) {
        productService.restoreProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAll(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        log.info("getAll by user");
        return ResponseEntity.ok(ApiResponse.success(productService.filterProducts(
                categoryId, brandId, minPrice, maxPrice, ProductStatus.ACTIVE,  keyword, pageable)));
    }

    @GetMapping("/manager/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> filter(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(productService.filterProducts(
                categoryId, brandId, minPrice, maxPrice, status, keyword, pageable)));
    }

    @GetMapping("/products/top-rated")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getTopRated(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(productService.getTopRated(limit)));
    }

    @GetMapping("/products/best-sellers")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getBestSellers(
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(ApiResponse.success(productService.getBestSellers(limit)));
    }

    @GetMapping("/products/price-range")
    public ResponseEntity<ApiResponse<java.util.Map<String, java.math.BigDecimal>>> getPriceRange() {
        return ResponseEntity.ok(ApiResponse.success(productService.getActivePriceRange()));
    }

    @GetMapping("/admin/products/deleted")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getDeleted(
             Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(productService.getDeleted(pageable)));
    }

    @PatchMapping("/admin/products/{id}/status")
    public ResponseEntity<ApiResponse<ProductResponse>> changeStatus(
            @PathVariable Long id,
            @RequestParam ProductStatus status) {
        return ResponseEntity.ok(ApiResponse.success(productService.changeStatus(id, status)));
    }

    @PatchMapping("/admin/products/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(@RequestBody List<Long> ids) {
        productService.bulkDelete(ids);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/products/bulk-status")
    public ResponseEntity<ApiResponse<Void>> bulkUpdateStatus(
            @RequestBody List<Long> ids,
            @RequestParam ProductStatus status) {
        productService.bulkUpdateStatus(ids, status);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/products/{id}/rating")
    public ResponseEntity<ApiResponse<Void>> updateRating(
            @PathVariable Long id,
            @RequestParam @DecimalMin("1.0") @DecimalMax("5.0") BigDecimal rating) {
        productService.updateRating(id, rating);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/products/export")
    public  ResponseEntity<ApiResponse<Void>> exportToExcel(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<Long> ids,
            HttpServletResponse response) throws IOException {

        List<Product> products = productService.exportProducts(categoryId, brandId, minPrice, maxPrice, status, keyword, ids);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=Danh_sach_san_pham.xlsx");

        ProductExcelExporter.export(products, response.getOutputStream());
        return ResponseEntity.noContent().build();
    }
}
