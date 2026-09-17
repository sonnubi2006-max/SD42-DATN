package com.base.controller;

import com.base.dto.request.promotion.PromotionRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.promotion.PromotionResponse;
import com.base.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping("/admin/promotions")
    public ResponseEntity<ApiResponse<PromotionResponse>> create(@Valid @RequestBody PromotionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(promotionService.create(request)));
    }

    @PutMapping("/admin/promotions/{id}")
    public ResponseEntity<ApiResponse<PromotionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PromotionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.update(id, request)));
    }

    @PatchMapping("/admin/promotions/{id}/cancel")
    public ResponseEntity<ApiResponse<PromotionResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.cancel(id)));
    }

    @PatchMapping("/admin/promotions/{id}/status")
    public ResponseEntity<ApiResponse<PromotionResponse>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.toggleStatus(id)));
    }

    @GetMapping("/admin/promotions")
    public ResponseEntity<ApiResponse<Page<PromotionResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String applyType,
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        java.time.LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        java.time.LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;
        return ResponseEntity.ok(ApiResponse.success(promotionService.getAll(keyword, status, applyType, start, end, pageable)));
    }

    @GetMapping("/admin/promotions/{id}")
    public ResponseEntity<ApiResponse<PromotionResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getById(id)));
    }

    @GetMapping("/promotions/active")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getActivePromotions()));
    }
}
