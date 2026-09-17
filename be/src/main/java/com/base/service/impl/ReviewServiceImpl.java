package com.base.service.impl;

import com.base.dto.request.ImageUploadMessage;
import com.base.dto.request.ImageUploadReviewMessage;
import com.base.dto.request.review.CreateReviewRequest;
import com.base.dto.request.review.UpdateReviewRequest;
import com.base.dto.response.review.ReviewResponse;
import com.base.dto.response.review.ReviewSummaryResponse;
import com.base.dto.response.review.UnreviewedProductResponse;
import com.base.entity.*;
import com.base.enums.ReviewStatus;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.queue.ImageUploadProducer;
import com.base.repository.*;
import com.base.service.ReviewService;
import com.base.utils.SecurityUtils;
import com.base.utils.BadWordFilter;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SecurityUtils securityUtils;
    private final LocalStorageService localStorageService;
    private final ImageUploadProducer imageUploadProducer;
    private final ModelMapper modelMapper;

    @Override
    public ReviewResponse createReview(
            CreateReviewRequest request,
            List<MultipartFile> files) {

        Customer customer = customerRepository.findById(securityUtils.getCurrentUserId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));

        OrderDetail orderDetail = orderDetailRepository.findById(
                        request.getOrderDetailId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy sản phẩm đã mua"));

        if (!orderDetail.getOrder().getCustomer().getCustomerId().equals(customer.getCustomerId())) {
            throw new BadRequestException(
                    "Bạn không thể đánh giá sản phẩm này");
        }

        if (reviewRepository.existsByOrderDetail_OrderDetailId(orderDetail.getOrderDetailId())) {
            throw new BadRequestException(
                    "Bạn đã đánh giá sản phẩm này");
        }

        boolean containsInappropriateWords = BadWordFilter.containsBadWords(request.getComment());

        Review review = Review.builder()
                .customer(customer)
                .product(orderDetail.getVariant().getProduct())
                .variant(orderDetail.getVariant())
                .orderDetail(orderDetail)
                .rating(request.getRating())
                .comment(request.getComment())
                .sizeFeedback(request.getSizeFeedback())
                .status(containsInappropriateWords ? ReviewStatus.HIDDEN : ReviewStatus.APPROVED)
                .build();

        review = reviewRepository.save(review);

        if (files != null && !files.isEmpty()) {
            review = uploadImages(review, files);
        }

        if (review.getStatus() == ReviewStatus.APPROVED) {
            updateProductRating(review.getProduct().getProductId());
        }

        return toResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(
            Long reviewId,
            UpdateReviewRequest request,
            List<MultipartFile> files) {

        Customer customer = customerRepository.findById(securityUtils.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));

        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        if (!review.getCustomer().getCustomerId().equals(customer.getCustomerId())) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa đánh giá này");
        }

        if (review.getStatus() == ReviewStatus.REJECTED
                || review.getStatus() == ReviewStatus.HIDDEN) {

            throw new BadRequestException("Không thể chỉnh sửa đánh giá này");
        }

        boolean containsInappropriateWords = BadWordFilter.containsBadWords(request.getComment());

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setSizeFeedback(request.getSizeFeedback());
        review.setStatus(containsInappropriateWords ? ReviewStatus.HIDDEN : ReviewStatus.APPROVED);

        review = reviewRepository.save(review);

        if (files != null && !files.isEmpty()) {
            if (request.getImagesDelete() != null
                    && !request.getImagesDelete().isEmpty()) {

                List<ReviewImage> imagesDelete =
                        reviewImageRepository.findAllById(
                                request.getImagesDelete());

                review.getImages().removeAll(imagesDelete);

                reviewImageRepository.deleteAll(imagesDelete);
            }

            review = uploadImages(review, files);
        }

        updateProductRating(review.getProduct().getProductId());

        return toResponse(review);
    }

    private Review uploadImages(
            Review review,
            List<MultipartFile> files) {

        if (files != null && !files.isEmpty()) {

            for (MultipartFile file : files) {
                String tempPath = localStorageService.saveTempFile(file);
                String tempUrl = localStorageService.getTempUrl(tempPath);

                ReviewImage image = ReviewImage.builder()
                        .imageUrl(tempUrl)
                        .review(review)
                        .build();
                image = reviewImageRepository.save(image);

                imageUploadProducer.sendUploadMessage(
                        ImageUploadMessage.builder()
                                .id(image.getReviewImageId())
                                .table("REVIEW")
                                .tempFilePath(tempPath)
                                .action(ImageUploadMessage.ActionType.CREATE_REVIEW)
                                .build()
                );

                review.getImages().add(image);
            }
        }

        return review;
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId) {
        Customer customer = customerRepository.findById(securityUtils.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy đánh giá"));

        if (!review.getCustomer().getCustomerId().equals(customer.getCustomerId())) {
            throw new BadRequestException(
                    "Bạn không có quyền xóa đánh giá này");
        }

        if (review.getStatus() == ReviewStatus.DELETED) {
            throw new BadRequestException("Đánh giá này đã bị xóa rồi");
        }

        review.setStatus(ReviewStatus.DELETED);
        reviewRepository.save(review);

        updateProductRating(review.getProduct().getProductId());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(
            Long productId,
            Integer rating,
            Pageable pageable) {

        if (rating != null) {

            return reviewRepository
                    .findByProduct_ProductIdAndStatusAndRating(
                            productId,
                            ReviewStatus.APPROVED,
                            rating,
                            pageable
                    )
                    .map(this::toResponse);
        }

        return reviewRepository
                .findByProduct_ProductIdAndStatus(
                        productId,
                        ReviewStatus.APPROVED,
                        pageable
                )
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getMyReviews(
            Pageable pageable) {

        Long userId = securityUtils.getCurrentUserId();

        return reviewRepository
                .findActiveReviewsByCustomerId(
                        userId,
                        pageable
                )
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UnreviewedProductResponse> getMyUnreviewedProducts(Pageable pageable) {
        return orderDetailRepository
                .findUnreviewedCompletedItems(securityUtils.getCurrentUserId(), pageable)
                .map(this::toUnreviewedProductResponse);
    }

    private UnreviewedProductResponse toUnreviewedProductResponse(OrderDetail detail) {
        Product product = detail.getVariant().getProduct();
        return UnreviewedProductResponse.builder()
                .orderDetailId(detail.getOrderDetailId())
                .orderId(detail.getOrder().getOrderId())
                .orderCode(detail.getOrder().getOrderCode())
                .completedAt(detail.getOrder().getUpdatedAt())
                .productId(product.getProductId())
                .productCode(product.getProductCode())
                .productSlug(product.getProductSlug())
                .productName(detail.getProductName())
                .imageUrl(detail.getImageUrl())
                .size(detail.getSize())
                .color(detail.getColor())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryResponse getReviewSummary(
            Long productId) {

        Double averageRating =
                reviewRepository.calculateAverageRating(productId);

        Long reviewCount =
                reviewRepository.countApprovedByProductId(productId);

        Long fiveStar =
                reviewRepository.countByProductIdAndRating(productId, 5);

        Long fourStar =
                reviewRepository.countByProductIdAndRating(productId, 4);

        Long threeStar =
                reviewRepository.countByProductIdAndRating(productId, 3);

        Long twoStar =
                reviewRepository.countByProductIdAndRating(productId, 2);

        Long oneStar =
                reviewRepository.countByProductIdAndRating(productId, 1);

        return ReviewSummaryResponse.builder()
                .productId(productId)
                .averageRating(
                        averageRating == null
                                ? 0.0
                                : averageRating)
                .reviewCount(reviewCount)
                .fiveStar(fiveStar)
                .fourStar(fourStar)
                .threeStar(threeStar)
                .twoStar(twoStar)
                .oneStar(oneStar)
                .fiveStarPercent(
                        calculatePercent(fiveStar, reviewCount))
                .fourStarPercent(
                        calculatePercent(fourStar, reviewCount))
                .threeStarPercent(
                        calculatePercent(threeStar, reviewCount))
                .twoStarPercent(
                        calculatePercent(twoStar, reviewCount))
                .oneStarPercent(
                        calculatePercent(oneStar, reviewCount))
                .build();
    }

    @Override
    public ReviewResponse approveReview(Long reviewId) {

        Review review = findReview(reviewId);

        if (review.getStatus() == ReviewStatus.DELETED) {
            throw new BadRequestException("Đánh giá này đã bị người dùng xóa, không thể phê duyệt!");
        }

        if (BadWordFilter.containsBadWords(review.getComment())) {
            throw new BadRequestException(
                    "Đánh giá chứa từ không phù hợp và phải tiếp tục được ẩn");
        }

        review.setStatus(
                ReviewStatus.APPROVED);

        reviewRepository.save(review);

        updateProductRating(
                review.getProduct().getProductId());

        return toResponse(review);
    }

    @Override
    public ReviewResponse rejectReview(Long reviewId) {

        Review review = findReview(reviewId);

        if (review.getStatus() == ReviewStatus.DELETED) {
            throw new BadRequestException("Đánh giá này đã bị người dùng xóa, không thể từ chối!");
        }

        review.setStatus(
                ReviewStatus.REJECTED);

        review = reviewRepository.save(review);
        updateProductRating(review.getProduct().getProductId());
        return toResponse(review);
    }

    @Override
    public ReviewResponse hideReview(Long reviewId) {

        Review review = findReview(reviewId);

        if (review.getStatus() == ReviewStatus.DELETED) {
            throw new BadRequestException("Đánh giá này đã bị người dùng xóa, không thể ẩn!");
        }

        review.setStatus(
                ReviewStatus.HIDDEN);

        review = reviewRepository.save(review);
        updateProductRating(review.getProduct().getProductId());
        return toResponse(review);
    }

    private void updateProductRating(
            Long productId) {

        Product product = productRepository.findById(
                        productId)
                .orElseThrow();

        Double average =
                reviewRepository.calculateAverageRating(
                        productId);

        Long count =
                reviewRepository.countApprovedByProductId(
                        productId);

        product.setAverageRating(
                average == null
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(average));

        productRepository.save(product);
    }

    private Review findReview(Long reviewId) {
        return reviewRepository.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá!"));
    }

    private ReviewResponse toResponse(
            Review review) {

        ReviewResponse response =
                modelMapper.map(
                        review,
                        ReviewResponse.class);

        response.setUserId(
                review.getCustomer().getCustomerId());

        response.setUserName(
                review.getCustomer().getFullName());

        response.setImages(
                review.getImages()
                        .stream()
                        .map(ReviewImage::getImageUrl)
                        .toList());

        if (review.getProduct() != null) {
            response.setProductId(review.getProduct().getProductId());
            response.setProductName(review.getProduct().getProductName());
            response.setProductCode(review.getProduct().getProductCode());
            response.setProductSlug(review.getProduct().getProductSlug());
            if (review.getProduct().getImages() != null && !review.getProduct().getImages().isEmpty()) {
                response.setProductImageUrl(review.getProduct().getImages().get(0).getImageUrl());
            }
        }

        if (review.getVariant() != null) {
            response.setVariantId(review.getVariant().getVariantId());
        }

        if (review.getOrderDetail() != null) {
            if (review.getOrderDetail().getOrder() != null) {
                response.setOrderId(review.getOrderDetail().getOrder().getOrderId());
                response.setOrderCode(review.getOrderDetail().getOrder().getOrderCode());
            }
            response.setColor(review.getOrderDetail().getColor());
            response.setSize(review.getOrderDetail().getSize());
        }

        response.setVerifiedPurchase(review.getOrderDetail() != null);

        return response;
    }

    private Double calculatePercent(
            Long count,
            Long total) {

        if (total == null || total == 0) {
            return 0.0;
        }

        return (count.doubleValue() * 100.0)
                / total.doubleValue();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> filterReviewsForAdmin(
            ReviewStatus status,
            Integer rating,
            String keyword,
            LocalDateTime fromDate,
            LocalDateTime toDateExclusive,
            Pageable pageable
    ) {
        return reviewRepository.filterReviews(
                status, rating, keyword,
                fromDate, toDateExclusive, pageable)
                .map(this::toResponse);
    }
}
