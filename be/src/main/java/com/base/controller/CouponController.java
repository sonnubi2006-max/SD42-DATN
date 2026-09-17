package com.base.controller;

import com.base.dto.request.coupon.CouponRequest;
import com.base.dto.request.coupon.ValidateCouponRequest;
import com.base.dto.request.CustomUserDetails;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.coupon.CouponResponse;
import com.base.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @PostMapping("/admin/coupons")
    public ResponseEntity<ApiResponse<CouponResponse>> create(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(couponService.create(request)));
    }

    @PutMapping("/admin/coupons/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(couponService.update(id, request)));
    }

    @PatchMapping("/admin/coupons/{id}/status")
    public ResponseEntity<ApiResponse<CouponResponse>> setStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(ApiResponse.success(couponService.setStatus(id, status)));
    }

    @GetMapping("/manager/coupons")
    public ResponseEntity<ApiResponse<Page<CouponResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String discountType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        LocalDateTime start = startDate != null
                ? startDate.atStartOfDay()
                : null;

        LocalDateTime end = endDate != null
                ? endDate.atTime(23, 59, 59)
                : null;

        return ResponseEntity.ok(ApiResponse.success(couponService.getAll(keyword, status, type, discountType, start, end, customerId, pageable)));
    }

    @PostMapping("/admin/coupons/refresh-status")
    public ResponseEntity<ApiResponse<Integer>> refreshStatus() {
        return ResponseEntity.ok(ApiResponse.success(couponService.refreshAllStatuses()));
    }

    @GetMapping("/admin/coupons/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(couponService.getById(id)));
    }

    @GetMapping("/coupons")
    public ResponseEntity<ApiResponse<java.util.List<CouponResponse>>> getActiveCoupons(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long customerId = userDetails != null ? userDetails.getUserId() : null;
        return ResponseEntity.ok(ApiResponse.success(couponService.getActiveCouponsForUser(customerId)));
    }

    @PostMapping("/coupons/validate")
    public ResponseEntity<ApiResponse<CouponResponse>> validate(
            @Valid @RequestBody ValidateCouponRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUserId() : null;
        return ResponseEntity.ok(ApiResponse.success(couponService.validate(request, userId)));
    }
}