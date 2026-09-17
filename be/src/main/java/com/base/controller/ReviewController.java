package com.base.controller;

import com.base.dto.request.review.CreateReviewRequest;
import com.base.dto.request.review.UpdateReviewRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.review.ReviewResponse;
import com.base.dto.response.review.ReviewSummaryResponse;
import com.base.dto.response.review.UnreviewedProductResponse;
import com.base.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping(
            value = "/reviews",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @ModelAttribute CreateReviewRequest request,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.createReview(request, files)));
    }

    @PutMapping(
            value = "/reviews/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long id,
            @Valid @ModelAttribute UpdateReviewRequest request,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.updateReview(
                id,
                request,
                files
        )));
    }

    @GetMapping("/reviews/product/{productId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(required = false) Integer rating,
            Pageable pageable
    ) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.getProductReviews(productId, rating, pageable)));
    }

    @GetMapping("/reviews/product/{productId}/summary")
    public ResponseEntity<ApiResponse<ReviewSummaryResponse>> getSummary(@PathVariable Long productId) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.getReviewSummary(productId)));
    }

    @GetMapping("/reviews/my-reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getMyReviews(Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.getMyReviews(pageable)));
    }

    @GetMapping("/reviews/my-unreviewed-products")
    public ResponseEntity<ApiResponse<Page<UnreviewedProductResponse>>> getMyUnreviewedProducts(
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getMyUnreviewedProducts(pageable)));
    }

    @GetMapping("/admin/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> filterReviews(
            @RequestParam(required = false) com.base.enums.ReviewStatus status,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate fromDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate toDate,
            org.springframework.data.domain.Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.filterReviewsForAdmin(
                status,
                rating,
                keyword,
                fromDate == null ? null : fromDate.atStartOfDay(),
                toDate == null ? null : toDate.plusDays(1).atStartOfDay(),
                pageable
        )));
    }

    @PatchMapping("/admin/reviews/{id}/approve")
    public ResponseEntity<ApiResponse<ReviewResponse>> approveReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.approveReview(id)));
    }

    @PatchMapping("/admin/reviews/{id}/reject")
    public ResponseEntity<ApiResponse<ReviewResponse>> rejectReview(@PathVariable Long id
    ) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.rejectReview(id)));
    }

    @PatchMapping("/admin/reviews/{id}/hide")
    public ResponseEntity<ApiResponse<ReviewResponse>> hideReview(@PathVariable Long id) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.hideReview(id)));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {

        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
