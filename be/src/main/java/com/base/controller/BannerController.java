package com.base.controller;

import com.base.dto.request.banner.BannerCreateRequest;
import com.base.dto.request.banner.BannerUpdateRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.banner.BannerResponse;
import com.base.dto.response.banner.BannerStatisticProjection;
import com.base.service.BannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class BannerController {
    private final BannerService bannerService;

    @GetMapping("/banners")
    public ResponseEntity<ApiResponse<Page<BannerResponse>>> getAllBanners(
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "bannerId") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) Boolean checkDate
    ) {
        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sortBy = Sort.by(sortDirection, sort);
        Pageable pageable = PageRequest.of(page, size, sortBy);

        return ResponseEntity.ok(ApiResponse.success(bannerService.getBanners(keyword, isActive, checkDate, pageable)));
    }

    @GetMapping("/banners/{bannerId}")
    public ResponseEntity<ApiResponse<BannerResponse>> getBanner(@PathVariable Long bannerId) {
        return ResponseEntity.ok(ApiResponse.success(bannerService.getBanner(bannerId)));
    }

    @GetMapping("/banners/statistics")
    public ResponseEntity<ApiResponse<BannerStatisticProjection>> getBannerStatistics() {
        return ResponseEntity.ok(ApiResponse.success(bannerService.getBannerStatistics()));
    }

    @PostMapping(
            value = "/admin/banners",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<BannerResponse>> createBanner(
            @ModelAttribute BannerCreateRequest bannerCreateRequest,
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(bannerService.createBanner(bannerCreateRequest, file)));
    }

    @PutMapping(
            value = "/admin/banners/{bannerId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<BannerResponse>> updateBanner(
            @PathVariable Long bannerId,
            @ModelAttribute BannerUpdateRequest bannerUpdateRequest,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(ApiResponse.success(bannerService.updateBanner(bannerId, bannerUpdateRequest, file)));
    }

    @DeleteMapping("/admin/banners/{bannerId}")
    public ResponseEntity<ApiResponse<BannerResponse>> deleteBanner(@PathVariable Long bannerId) {
        bannerService.deleteBanner(bannerId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/banners/{bannerId}")
    public ResponseEntity<ApiResponse<Void>> updateStatusBanner(@PathVariable Long bannerId) {
        bannerService.updateStatusBanner(bannerId);
        return ResponseEntity.noContent().build();
    }
}
