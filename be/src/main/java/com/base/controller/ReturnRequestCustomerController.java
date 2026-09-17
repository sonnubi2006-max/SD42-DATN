package com.base.controller;

import com.base.dto.request.returnRequest.CreateReturnRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.returnRequest.ReturnResponse;
import com.base.entity.Order;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.repository.OrderRepository;
import com.base.service.ReturnRequestService;
import com.base.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import com.base.service.impl.CloudinaryService;

import com.base.dto.request.returnRequest.RefundPreviewRequest;
import com.base.dto.response.returnRequest.RefundPreviewResponse;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/returns")
public class ReturnRequestCustomerController {

    private final ReturnRequestService returnRequestService;
    private final SecurityUtils securityUtils;
    private final OrderRepository orderRepository;
    private final CloudinaryService cloudinaryService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadImage(
            @RequestParam("file") MultipartFile file
    ) {
        String url = cloudinaryService.uploadImage(file);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh lên thành công", url));
    }

    @PostMapping("/refund-preview")
    public ResponseEntity<ApiResponse<RefundPreviewResponse>> getRefundPreview(
            @Valid @RequestBody RefundPreviewRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.calculateRefundPreview(request)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReturnResponse>> create(
            @Valid @RequestBody CreateReturnRequest request
    ) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        Long currentUserId = securityUtils.getCurrentUserId();
        if (order.getCustomer() == null || !order.getCustomer().getCustomerId().equals(currentUserId)) {
            throw new BadRequestException("Bạn không có quyền tạo yêu cầu đổi hàng cho đơn hàng này");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(returnRequestService.create(request)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<ReturnResponse>>> getMyReturns(
            Pageable pageable
    ) {
        Long currentUserId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.getMyReturns(currentUserId, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnResponse>> getById(@PathVariable Long id) {
        Long currentUserId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.getMyReturnById(id, currentUserId)));
    }
}
