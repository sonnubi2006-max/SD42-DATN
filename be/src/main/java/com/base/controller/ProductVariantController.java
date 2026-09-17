package com.base.controller;

import com.base.dto.request.product.ProductVariantRequest;
import com.base.dto.request.product.BulkUpdateProductVariantStatusRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.product.ProductImageResponse;
import com.base.dto.response.product.ProductVariantResponse;
import com.base.dto.response.product.VariantDamageResponse;
import com.base.enums.ProductStatus;
import com.base.enums.ProductVariantStatus;
import com.base.exception.BadRequestException;
import com.base.service.ProductVariantService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService variantService;
    private final ObjectMapper objectMapper;

    @PostMapping(
            value = "/admin/products/{productId}/variants",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<ProductVariantResponse>> addVariant(
            @PathVariable Long productId,
            @ModelAttribute @Valid ProductVariantRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(variantService.addVariant(productId, request, file)));
    }

    @PostMapping(
            value = "/admin/products/{productId}/variants/bulk",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> addVariants(
            @PathVariable Long productId,
            @RequestPart("variants") String variantsJson,
            @RequestPart("files") List<MultipartFile> files
    ) {
        List<ProductVariantRequest> requests;
        try {
            requests = objectMapper.readValue(
                    variantsJson, new TypeReference<List<ProductVariantRequest>>() {});
        } catch (Exception e) {
            throw new BadRequestException("Dữ liệu biến thể không hợp lệ");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        variantService.addVariantsBulk(productId, requests, files)));
    }

    @PutMapping("/admin/products/variants/{variantId}")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> updateVariant(
            @PathVariable Long variantId,
            @ModelAttribute @Valid ProductVariantRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(ApiResponse.success(variantService.updateVariant(variantId, request, file)));
    }

    @PatchMapping("/admin/products/variants/{variantId}/status")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> updateVariantStatus(
            @PathVariable Long variantId,
            @RequestParam ProductVariantStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(variantService.updateVariantStatus(variantId, status)));
    }

    @DeleteMapping("/admin/products/variants/{variantId}")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(@PathVariable Long variantId) {
        variantService.deleteVariant(variantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/products/{productId}/variants")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> getVariants(
            @PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(variantService.getVariantsByProduct(productId)));
    }

    @GetMapping("/products/variants/barcode/{barcode}")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> scanByBarcode(
            @PathVariable String barcode) {
        return ResponseEntity.ok(ApiResponse.success(variantService.findByBarcode(barcode)));
    }

    @GetMapping("/products/variants/{variantId}")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> findById(
            @PathVariable Long variantId) {
        return ResponseEntity.ok(ApiResponse.success(variantService.findById(variantId)));
    }

    @GetMapping(
            value = "/admin/products/variants/{variantId}/qr-code",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    public ResponseEntity<byte[]> getVariantQrCode(@PathVariable Long variantId) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=variant-" + variantId + "-qr.png"
                )
                .body(variantService.generateVariantQrCode(variantId));
    }

    @GetMapping("/admin/products/variants/{variantId}/damages")
    public ResponseEntity<ApiResponse<VariantDamageResponse>> getDamageHistory(
            @PathVariable Long variantId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String source,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(variantService.getDamageHistory(
                variantId, keyword, source, fromDate, toDate, page, size)));
    }

    @GetMapping("/admin/products/variants")
    public ResponseEntity<ApiResponse<Page<ProductVariantResponse>>> getVariantsByAdmin(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false)  BigDecimal maxPrice,
            @RequestParam(required = false) ProductVariantStatus status,
            Pageable pageable

            ) {
        return ResponseEntity.ok(ApiResponse.success(variantService.filterProductVariants(keyword,productId,minPrice,maxPrice,status,pageable)));
    }

    @DeleteMapping("/admin/products/variants/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(@RequestBody List<Long> ids) {
        variantService.bulkDelete(ids);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/admin/products/variants/bulk-status")
    public ResponseEntity<ApiResponse<Void>> bulkUpdateStatus(
            @Valid @RequestBody BulkUpdateProductVariantStatusRequest request) {
        variantService.bulkUpdateStatus(request.getVariantIds(), request.getStatus());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/products/variants/{id}/restore")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> restore(@PathVariable Long id) {
        variantService.restoreProduct(id);
        return ResponseEntity.noContent().build();
    }
}
