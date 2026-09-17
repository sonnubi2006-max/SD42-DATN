package com.base.service;

import com.base.dto.request.review.CreateReviewRequest;
import com.base.dto.request.review.UpdateReviewRequest;
import com.base.dto.response.review.ReviewResponse;
import com.base.dto.response.review.ReviewSummaryResponse;
import com.base.dto.response.review.UnreviewedProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ReviewService {

    ReviewResponse createReview(
            CreateReviewRequest request,
            List<MultipartFile> files
    );

    ReviewResponse updateReview(
            Long reviewId,
            UpdateReviewRequest request,
            List<MultipartFile> files
    );

    void deleteReview(Long reviewId);

    Page<ReviewResponse> getProductReviews(
            Long productId,
            Integer rating,
            Pageable pageable
    );

    Page<ReviewResponse> getMyReviews(
            Pageable pageable
    );

    Page<UnreviewedProductResponse> getMyUnreviewedProducts(Pageable pageable);

    ReviewSummaryResponse getReviewSummary(
            Long productId
    );

    ReviewResponse approveReview(Long reviewId);

    ReviewResponse rejectReview(Long reviewId);

    ReviewResponse hideReview(Long reviewId);

    Page<ReviewResponse> filterReviewsForAdmin(
            com.base.enums.ReviewStatus status,
            Integer rating,
            String keyword,
            java.time.LocalDateTime fromDate,
            java.time.LocalDateTime toDateExclusive,
            Pageable pageable
    );
}
