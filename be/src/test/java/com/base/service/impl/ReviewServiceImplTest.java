package com.base.service.impl;

import com.base.dto.request.review.CreateReviewRequest;
import com.base.dto.request.review.UpdateReviewRequest;
import com.base.dto.response.review.ReviewResponse;
import com.base.entity.Customer;
import com.base.entity.Order;
import com.base.entity.OrderDetail;
import com.base.entity.Product;
import com.base.entity.ProductVariant;
import com.base.entity.Review;
import com.base.enums.ReviewStatus;
import com.base.queue.ImageUploadProducer;
import com.base.repository.CustomerRepository;
import com.base.repository.OrderDetailRepository;
import com.base.repository.ProductRepository;
import com.base.repository.ReviewImageRepository;
import com.base.repository.ReviewRepository;
import com.base.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private ReviewImageRepository reviewImageRepository;
    @Mock private OrderDetailRepository orderDetailRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private SecurityUtils securityUtils;
    @Mock private LocalStorageService localStorageService;
    @Mock private ImageUploadProducer imageUploadProducer;
    @Mock private ModelMapper modelMapper;

    @InjectMocks private ReviewServiceImpl reviewService;

    private Customer customer;
    private Product product;

    @BeforeEach
    void setUp() {
        customer = Customer.builder()
                .customerId(1L)
                .email("customer@example.com")
                .fullName("Khách hàng")
                .build();
        product = Product.builder()
                .productId(5L)
                .productName("Sản phẩm")
                .productCode("SP-5")
                .productSlug("san-pham")
                .build();
        ProductVariant variant = ProductVariant.builder()
                .variantId(7L)
                .product(product)
                .build();
        Order order = Order.builder()
                .orderId(8L)
                .orderCode("ORD-8")
                .customer(customer)
                .build();
        OrderDetail detail = OrderDetail.builder()
                .orderDetailId(9L)
                .order(order)
                .variant(variant)
                .color("Đen")
                .size("M")
                .build();

        this.orderDetail = detail;
    }

    @Test
    void inappropriateReviewIsKeptIntactAndHiddenAutomatically() {
        stubCreateReviewDependencies();
        CreateReviewRequest request = requestWithComment("Sản phẩm lừa đảo, quá tệ");

        reviewService.createReview(request, null);

        ArgumentCaptor<Review> captor = ArgumentCaptor.forClass(Review.class);
        org.mockito.Mockito.verify(reviewRepository).save(captor.capture());
        assertEquals(ReviewStatus.HIDDEN, captor.getValue().getStatus());
        assertEquals("Sản phẩm lừa đảo, quá tệ", captor.getValue().getComment());
    }

    @Test
    void editedReviewWithInappropriateWordsIsHiddenAutomatically() {
        Review review = Review.builder()
                .reviewId(12L)
                .customer(customer)
                .product(product)
                .status(ReviewStatus.APPROVED)
                .rating(5)
                .comment("Sản phẩm đẹp")
                .build();
        when(reviewRepository.findById(12L)).thenReturn(Optional.of(review));
        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        stubAuthenticatedCustomer();
        stubReviewSaveAndMapping();

        UpdateReviewRequest request = new UpdateReviewRequest();
        request.setRating(1);
        request.setComment("Sản phẩm quá tệ, lừa đảo");

        reviewService.updateReview(12L, request, null);

        assertEquals(ReviewStatus.HIDDEN, review.getStatus());
    }

    @Test
    void hiddenInappropriateReviewCannotBeApproved() {
        Review review = Review.builder()
                .reviewId(12L)
                .customer(customer)
                .product(product)
                .status(ReviewStatus.HIDDEN)
                .rating(1)
                .comment("Sản phẩm lừa đảo")
                .build();
        when(reviewRepository.findById(12L)).thenReturn(Optional.of(review));

        assertThrows(
                com.base.exception.BadRequestException.class,
                () -> reviewService.approveReview(12L)
        );
        assertEquals(ReviewStatus.HIDDEN, review.getStatus());
    }

    @Test
    void normalReviewIsApprovedAutomatically() {
        stubCreateReviewDependencies();
        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        when(reviewRepository.calculateAverageRating(5L)).thenReturn(5.0);
        when(reviewRepository.countApprovedByProductId(5L)).thenReturn(1L);

        reviewService.createReview(requestWithComment("Sản phẩm đẹp và giao hàng nhanh"), null);

        ArgumentCaptor<Review> captor = ArgumentCaptor.forClass(Review.class);
        org.mockito.Mockito.verify(reviewRepository).save(captor.capture());
        assertEquals(ReviewStatus.APPROVED, captor.getValue().getStatus());
    }

    private CreateReviewRequest requestWithComment(String comment) {
        CreateReviewRequest request = new CreateReviewRequest();
        request.setOrderDetailId(9L);
        request.setRating(5);
        request.setComment(comment);
        return request;
    }

    private OrderDetail orderDetail;

    private void stubCreateReviewDependencies() {
        stubAuthenticatedCustomer();
        when(orderDetailRepository.findById(9L)).thenReturn(Optional.of(orderDetail));
        when(reviewRepository.existsByOrderDetail_OrderDetailId(9L)).thenReturn(false);
        stubReviewSaveAndMapping();
    }

    private void stubAuthenticatedCustomer() {
        when(securityUtils.getCurrentUserId()).thenReturn(1L);
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
    }

    private void stubReviewSaveAndMapping() {
        when(reviewRepository.save(any(Review.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(modelMapper.map(
                any(Review.class),
                org.mockito.ArgumentMatchers.eq(ReviewResponse.class)))
                .thenReturn(new ReviewResponse());
    }
}
