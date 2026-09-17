package com.base.service;

import com.base.dto.request.coupon.CouponRequest;
import com.base.dto.request.coupon.ValidateCouponRequest;
import com.base.dto.response.coupon.CouponResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface CouponService {
    CouponResponse create(CouponRequest request);
    CouponResponse update(Long couponId, CouponRequest request);
    CouponResponse setStatus(Long couponId, String status);
    Page<CouponResponse> getAll(String keyword, String status, String type, String discountType, LocalDateTime startDate, LocalDateTime endDate, Long customerId, Pageable pageable);
    CouponResponse getById(Long couponId);

    int refreshAllStatuses();

    CouponResponse validate(ValidateCouponRequest request, Long userId);
    void incrementUsage(Long couponId);
    void decrementUsage(Long couponId);

    java.util.List<CouponResponse> getActiveCouponsForUser(Long customerId);
}
