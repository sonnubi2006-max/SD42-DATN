package com.base.controller;

import com.base.dto.request.returnRequest.CreateReturnRequest;
import com.base.dto.request.returnRequest.RejectReturnRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.returnRequest.ReturnResponse;
import com.base.dto.response.returnRequest.ReturnStatisticsResponse;
import com.base.enums.ReturnStatus;
import com.base.service.ReturnRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import com.base.service.impl.CloudinaryService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/manager/returns")
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;
    private final CloudinaryService cloudinaryService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadImage(
            @RequestParam("file") MultipartFile file
    ) {
        String url = cloudinaryService.uploadImage(file);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh lên thành công", url));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReturnResponse>>> getAll(
            @RequestParam(required = false) ReturnStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime fromDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime toDate,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.search(status, keyword, fromDate, toDate, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.getById(id)));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<ReturnStatisticsResponse>> getStatistics(
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME)
            java.time.LocalDateTime fromDate,
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME)
            java.time.LocalDateTime toDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.getStatistics(fromDate, toDate)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReturnResponse>> create(
            @Valid @RequestBody CreateReturnRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(returnRequestService.create(request)));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ReturnResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.approve(id)));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ReturnResponse>> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectReturnRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.reject(id, request)));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<ReturnResponse>> complete(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) com.base.dto.request.returnRequest.CompleteReturnRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.complete(id, request)));
    }
}
