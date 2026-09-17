package com.base.service.impl;

import com.base.dto.request.coupon.CouponRequest;
import com.base.dto.request.coupon.ValidateCouponRequest;
import com.base.dto.event.EmailMessage;
import com.base.dto.response.coupon.CouponResponse;
import com.base.entity.Coupon;
import com.base.entity.Customer;
import com.base.enums.CouponStatus;
import com.base.enums.CouponType;
import com.base.enums.DiscountType;
import com.base.enums.EmailType;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceAlreadyExistsException;
import com.base.exception.ResourceNotFoundException;
import com.base.exception.UnauthorizedException;
import com.base.repository.CouponRepository;
import com.base.repository.CustomerRepository;
import com.base.repository.OrderRepository;
import com.base.queue.EmailProducer;
import com.base.service.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.text.NumberFormat;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository   couponRepository;
    private final OrderRepository    orderRepository;
    private final CustomerRepository customerRepository;
    private final ModelMapper        modelMapper;
    private final EmailProducer      emailProducer;

    @Override
    @Transactional
    public CouponResponse create(CouponRequest request) {
        normalizeCode(request);
        normalizeDescription(request);
        validateRequest(request);

        if (couponRepository.existsByCode(request.getCode())) {
            throw new ResourceAlreadyExistsException("Mã giảm giá '" + request.getCode() + "' đã tồn tại");
        }

        Coupon coupon = modelMapper.map(request, Coupon.class);
        coupon.setCouponId(null);
        coupon.setUsedQuantity(0);
        coupon.setCouponType(request.getCouponType() != null ? request.getCouponType() : CouponType.PUBLIC);
        applyTargetedCustomers(coupon, request);

        coupon.setStatus(request.getStatus() == CouponStatus.INACTIVE
                ? CouponStatus.INACTIVE
                : computeAutoStatus(coupon));
        coupon.setCreatedAt(LocalDateTime.now());

        Coupon saved = couponRepository.save(coupon);
        if (saved.isPersonal() && isAvailableStatus(saved.getStatus())) {
            sendCouponAssignedEmails(saved, saved.getTargetedCustomers());
        }
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse update(Long couponId, CouponRequest request) {
        normalizeCode(request);
        normalizeDescription(request);
        validateRequest(request);

        Coupon coupon = findById(couponId);
        String originalCode = coupon.getCode();
        boolean wasPersonal = coupon.isPersonal();
        CouponStatus previousStatus = coupon.getStatus();
        Set<Customer> previousCustomers = new HashSet<>(coupon.getTargetedCustomers());

        modelMapper.map(request, coupon);
        coupon.setCode(originalCode); 

        coupon.setDescription(request.getDescription());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setMinOrderValue(request.getMinOrderValue());
        // ModelMapper bỏ qua giá trị null. Cần gán tường minh để người dùng có thể
        // xóa giới hạn cũ bằng cách để trống hai trường này khi cập nhật.
        coupon.setTotalQuantity(request.getTotalQuantity());
        coupon.setMaxUsesPerUser(request.getMaxUsesPerUser());

        if (request.getCouponType() != null) coupon.setCouponType(request.getCouponType());
        applyTargetedCustomers(coupon, request);

        if (request.getStatus() == CouponStatus.INACTIVE) {
            coupon.setStatus(CouponStatus.INACTIVE);
        } else {
            coupon.setStatus(computeAutoStatus(coupon));
        }

        Coupon saved = couponRepository.save(coupon);
        notifyPersonalCouponChanges(saved, wasPersonal, previousStatus, previousCustomers);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse setStatus(Long couponId, String status) {
        Coupon coupon = findById(couponId);
        CouponStatus previousStatus = coupon.getStatus();
        Set<Customer> previousCustomers = new HashSet<>(coupon.getTargetedCustomers());
        CouponStatus targetStatus = CouponStatus.valueOf(status.toUpperCase());
        if (targetStatus == CouponStatus.INACTIVE) {
            coupon.setStatus(CouponStatus.INACTIVE);
        } else {
            coupon.setStatus(computeAutoStatus(coupon));
        }
        Coupon saved = couponRepository.save(coupon);
        notifyPersonalCouponChanges(saved, saved.isPersonal(), previousStatus, previousCustomers);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponResponse> getAll(String keyword, String status, String type, String discountType, LocalDateTime startDate, LocalDateTime endDate, Long customerId, Pageable pageable) {
        CouponStatus couponStatus = status != null && !status.isBlank()
                ? CouponStatus.valueOf(status.toUpperCase()) : null;
        CouponType couponType = type != null && !type.isBlank()
                ? CouponType.valueOf(type.toUpperCase()) : null;
        DiscountType discount = discountType != null && !discountType.isBlank()
                ? DiscountType.valueOf(discountType.toUpperCase()) : null;

        boolean isStatusFiltered = couponStatus != null;
        boolean isInactiveFilter = couponStatus == CouponStatus.INACTIVE;
        boolean isUpcomingFilter = couponStatus == CouponStatus.UPCOMING;
        boolean isActiveFilter = couponStatus == CouponStatus.ACTIVE;
        boolean isExpiredFilter = couponStatus == CouponStatus.EXPIRED;

        Page<Coupon> coupons = couponRepository.filterCoupons(
                keyword,
                isStatusFiltered,
                isInactiveFilter,
                isUpcomingFilter,
                isActiveFilter,
                isExpiredFilter,
                couponType,
                discount,
                startDate,
                endDate,
                LocalDateTime.now(),
                pageable
        );

        return coupons.map(c -> {
            CouponResponse res = toResponseForCustomer(c, customerId);

            if (!c.isValid()) {
                res.setValid(false);
            }

            if (c.isPersonal()) {
                if (customerId == null || !couponRepository.isCustomerEligible(c.getCouponId(), customerId)) {
                    res.setValid(false);
                }
            }

            return res;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getById(Long couponId) {
        return toResponse(findById(couponId));
    }

    @Override
    @Transactional
    public int refreshAllStatuses() {
        List<Coupon> coupons = couponRepository.findByStatusNot(CouponStatus.INACTIVE);
        int changed = 0;
        for (Coupon c : coupons) {
            CouponStatus next = computeAutoStatus(c);
            if (next != c.getStatus()) {
                CouponStatus previousStatus = c.getStatus();
                c.setStatus(next);
                if (c.isPersonal()
                        && isAvailableStatus(previousStatus)
                        && !isAvailableStatus(next)) {
                    sendCouponUnavailableEmails(c, c.getTargetedCustomers(),
                            "Ưu đãi đã hết thời gian áp dụng hoặc không còn lượt sử dụng.");
                }
                changed++;
            }
        }
        log.info("[PHIẾU GIẢM GIÁ] Cập nhật trạng thái: {}/{} phiếu thay đổi", changed, coupons.size());
        return changed;
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse validate(ValidateCouponRequest request, Long customerId) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            throw new BadRequestException("Mã giảm giá không được để trống");
        }
        if (request.getOrderAmount() == null || request.getOrderAmount().signum() < 0) {
            throw new BadRequestException("Giá trị đơn hàng không hợp lệ");
        }

        String normalizedCode = request.getCode().trim().toUpperCase(java.util.Locale.ROOT);
        Coupon coupon = couponRepository.findByCode(normalizedCode)
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá không tồn tại"));

        if (!coupon.isValid()) {
            throw new ResourceNotFoundException("Mã giảm giá đã hết hạn hoặc không còn lượt dùng");
        }

        if (coupon.isPersonal()) {
            if (customerId == null) {
                throw new UnauthorizedException(
                        "Vui lòng đăng nhập để sử dụng mã giảm giá cá nhân " + coupon.getCode()
                );
            }
            if (!couponRepository.isCustomerEligible(coupon.getCouponId(), customerId)) {
                throw new BadRequestException("Mã giảm giá này không áp dụng cho tài khoản của bạn");
            }
        }

        if (coupon.getMinOrderValue() != null
                && request.getOrderAmount().compareTo(coupon.getMinOrderValue()) < 0) {
            throw new BadRequestException(
                    "Đơn hàng tối thiểu " + coupon.getMinOrderValue() + "đ để dùng mã này"
            );
        }

        if (coupon.getMaxUsesPerUser() != null && customerId != null) {
            long usedByUser = orderRepository.countByUserIdAndCouponId(customerId, coupon.getCouponId());
            if (usedByUser >= coupon.getMaxUsesPerUser()) {
                throw new BadRequestException(usageLimitMessage(coupon, usedByUser));
            }
        }

        log.info("Phiếu giảm giá hợp lệ: mã={}, mã khách hàng={}", request.getCode(), customerId);
        return toResponse(coupon);
    }

    @Override
    @Transactional
    public void incrementUsage(Long couponId) {
        if (couponRepository.incrementUsedQuantity(couponId) == 0) {
            throw new BadRequestException("Phiếu giảm giá không tồn tại hoặc đã hết lượt sử dụng");
        }
    }

    @Override
    @Transactional
    public void decrementUsage(Long couponId) {
        couponRepository.decrementUsedQuantity(couponId);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<CouponResponse> getActiveCouponsForUser(Long customerId) {

        var pageable = org.springframework.data.domain.PageRequest.of(0, 200,
                org.springframework.data.domain.Sort.by("createdAt").descending());
        java.util.List<Coupon> publicCoupons = couponRepository
                .filterCoupons(null, true, false, false, true, false, CouponType.PUBLIC, null, null, null, LocalDateTime.now(), pageable)
                .getContent();

        java.util.List<Coupon> personalCoupons = customerId != null
                ? couponRepository.findPersonalCouponsForCustomer(customerId)
                : java.util.List.of();

        java.util.Map<Long, Coupon> merged = new java.util.LinkedHashMap<>();
        publicCoupons.forEach(c -> merged.put(c.getCouponId(), c));
        personalCoupons.forEach(c -> merged.put(c.getCouponId(), c));

        return merged.values().stream()
                .filter(Coupon::isValid)
                .map(c -> toResponseForCustomer(c, customerId))
                .collect(java.util.stream.Collectors.toList());
    }

    private CouponStatus computeAutoStatus(Coupon c) {
        LocalDateTime now = LocalDateTime.now();
        if (c.getEndDate() != null && now.isAfter(c.getEndDate())) return CouponStatus.EXPIRED;
        if (c.getTotalQuantity() != null && c.getUsedQuantity() != null
                && c.getUsedQuantity() >= c.getTotalQuantity()) return CouponStatus.EXPIRED;
        if (c.getStartDate() != null && now.isBefore(c.getStartDate())) return CouponStatus.UPCOMING;
        return CouponStatus.ACTIVE;
    }

    private void notifyPersonalCouponChanges(Coupon coupon,
                                             boolean wasPersonal,
                                             CouponStatus previousStatus,
                                             Set<Customer> previousCustomers) {
        CouponStatus currentStatus = effectiveStatus(coupon);
        boolean wasAvailable = wasPersonal && isAvailableStatus(previousStatus);
        boolean isAvailable = coupon.isPersonal() && isAvailableStatus(currentStatus);

        if (wasAvailable && !isAvailable) {
            if (coupon.isPersonal()) {
                Set<Customer> affectedCustomers = new HashSet<>(previousCustomers);
                affectedCustomers.addAll(coupon.getTargetedCustomers());
                sendCouponUnavailableEmails(coupon, affectedCustomers,
                        "Ưu đãi đã bị ngừng áp dụng hoặc không còn hiệu lực.");
            }
            return;
        }

        if (!isAvailable) return;

        Set<Customer> addedCustomers = new HashSet<>(coupon.getTargetedCustomers());
        if (wasAvailable) {
            addedCustomers.removeAll(previousCustomers);
        }
        sendCouponAssignedEmails(coupon, addedCustomers);

        if (wasAvailable) {
            Set<Customer> removedCustomers = new HashSet<>(previousCustomers);
            removedCustomers.removeAll(coupon.getTargetedCustomers());
            sendCouponUnavailableEmails(coupon, removedCustomers,
                    "Ưu đãi đã được gỡ khỏi tài khoản của bạn.");
        }
    }

    private CouponStatus effectiveStatus(Coupon coupon) {
        return coupon.getStatus() == CouponStatus.INACTIVE
                ? CouponStatus.INACTIVE
                : computeAutoStatus(coupon);
    }

    private boolean isAvailableStatus(CouponStatus status) {
        return status == CouponStatus.ACTIVE || status == CouponStatus.UPCOMING;
    }

    private void sendCouponAssignedEmails(Coupon coupon, Set<Customer> customers) {
        for (Customer customer : customers) {
            if (!hasEmail(customer)) continue;
            emailProducer.sendAfterCommit(EmailMessage.builder()
                    .to(customer.getEmail().trim())
                    .recipientName(customer.getFullName())
                    .type(EmailType.PERSONAL_COUPON_ASSIGNED)
                    .data(Map.of(
                            "couponCode", coupon.getCode(),
                            "description", coupon.getDescription() == null || coupon.getDescription().isBlank()
                                    ? "Ưu đãi cá nhân" : coupon.getDescription(),
                            "discountText", formatDiscount(coupon),
                            "minOrderValue", coupon.getMinOrderValue() == null
                                    ? "Không yêu cầu" : formatMoney(coupon.getMinOrderValue()),
                            "startDate", formatDateTime(coupon.getStartDate()),
                            "endDate", formatDateTime(coupon.getEndDate())
                    ))
                    .build());
        }
    }

    private void sendCouponUnavailableEmails(Coupon coupon, Set<Customer> customers, String reason) {
        for (Customer customer : customers) {
            if (!hasEmail(customer)) continue;
            emailProducer.sendAfterCommit(EmailMessage.builder()
                    .to(customer.getEmail().trim())
                    .recipientName(customer.getFullName())
                    .type(EmailType.PERSONAL_COUPON_UNAVAILABLE)
                    .data(Map.of("couponCode", coupon.getCode(), "reason", reason))
                    .build());
        }
    }

    private boolean hasEmail(Customer customer) {
        return customer != null && customer.getEmail() != null && !customer.getEmail().isBlank();
    }

    private String formatDiscount(Coupon coupon) {
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            String value = coupon.getDiscountValue().stripTrailingZeros().toPlainString() + "%";
            return coupon.getMaxDiscountAmount() == null
                    ? "Giảm " + value
                    : "Giảm " + value + ", tối đa " + formatMoney(coupon.getMaxDiscountAmount());
        }
        return "Giảm " + formatMoney(coupon.getDiscountValue());
    }

    private String formatMoney(java.math.BigDecimal value) {
        return NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN")).format(value) + " đ";
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "Không giới hạn" : value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }

    private void applyTargetedCustomers(Coupon coupon, CouponRequest request) {
        if (coupon.getCouponType() == CouponType.PERSONAL) {
            if (request.getTargetedCustomerIds() != null) {
                Set<Long> requestedIds = new HashSet<>(request.getTargetedCustomerIds());
                List<Customer> customers = customerRepository.findAllById(requestedIds);
                if (customers.size() != requestedIds.size()) {
                    throw new BadRequestException("Danh sách khách hàng được gán chứa ID không tồn tại");
                }
                coupon.setTargetedCustomers(new HashSet<>(customers));
            } else if (coupon.getTargetedCustomers() == null) {
                coupon.setTargetedCustomers(new HashSet<>());
            }
        } else {

            coupon.setTargetedCustomers(new HashSet<>());
        }
    }

    private Coupon findById(Long couponId) {
        return couponRepository.findById(couponId)
                .orElseThrow(() -> new BadRequestException("Phiếu giảm giá không tồn tại: " + couponId));
    }

    private void normalizeCode(CouponRequest request) {
        if (request != null && request.getCode() != null) {
            request.setCode(request.getCode().trim().toUpperCase(java.util.Locale.ROOT));
        }
    }

    private void normalizeDescription(CouponRequest request) {
        if (request != null) {
            request.setDescription(request.getDescription() == null
                    ? ""
                    : request.getDescription().trim());
        }
    }

    private void validateRequest(CouponRequest request) {
        if (request == null) {
            throw new BadRequestException("Dữ liệu phiếu giảm giá không được để trống");
        }
        if (request.getDiscountType() == null || request.getDiscountValue() == null
                || request.getDiscountValue().signum() <= 0) {
            throw new BadRequestException("Loại và giá trị giảm phải hợp lệ");
        }
        if (request.getDiscountType() == DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(java.math.BigDecimal.valueOf(100)) > 0) {
                throw new BadRequestException("Phần trăm giảm không được vượt quá 100%");
            }
            if (request.getMaxDiscountAmount() == null
                    || request.getMaxDiscountAmount().signum() <= 0) {
                throw new BadRequestException("Phiếu giảm giá theo phần trăm phải có giới hạn giảm tối đa lớn hơn 0");
            }
        }
        if (request.getMinOrderValue() != null && request.getMinOrderValue().signum() < 0) {
            throw new BadRequestException("Giá trị đơn tối thiểu không được âm");
        }
        if (request.getTotalQuantity() != null && request.getTotalQuantity() <= 0) {
            throw new BadRequestException("Số lượng phiếu giảm giá phải lớn hơn 0");
        }
        if (request.getMaxUsesPerUser() != null && request.getMaxUsesPerUser() <= 0) {
            throw new BadRequestException("Số lượt dùng mỗi khách phải lớn hơn 0");
        }
        if (request.getTotalQuantity() != null && request.getMaxUsesPerUser() != null
                && request.getMaxUsesPerUser() > request.getTotalQuantity()) {
            throw new BadRequestException("Số lượt dùng mỗi khách không được vượt tổng số lượng phiếu giảm giá");
        }
        CouponType couponType = request.getCouponType() != null
                ? request.getCouponType() : CouponType.PUBLIC;
        if (couponType == CouponType.PERSONAL
                && (request.getTargetedCustomerIds() == null
                || request.getTargetedCustomerIds().isEmpty())) {
            throw new BadRequestException("Phiếu giảm giá cá nhân phải được gán cho ít nhất một khách hàng");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new BadRequestException("Ngày bắt đầu và ngày kết thúc không được để trống");
        }
        if (!request.getStartDate().isBefore(request.getEndDate())) {
            throw new BadRequestException("Ngày bắt đầu phải trước ngày kết thúc");
        }
    }

    private CouponResponse toResponse(Coupon coupon) {
        CouponResponse response = modelMapper.map(coupon, CouponResponse.class);
        if (coupon.getStatus() != CouponStatus.INACTIVE) {
            response.setStatus(computeAutoStatus(coupon));
        }
        response.setValid(coupon.isValid());
        if (coupon.getTotalQuantity() != null) {
            int usedQuantity = coupon.getUsedQuantity() != null
                    ? coupon.getUsedQuantity()
                    : 0;
            response.setRemainingQuantity(Math.max(0,
                    coupon.getTotalQuantity() - usedQuantity));
        }
        if (coupon.getTargetedCustomers() != null) {
            response.setTargetedCustomers(
                    coupon.getTargetedCustomers().stream()
                            .map(c -> new CouponResponse.TargetedCustomer(
                                    c.getCustomerId(), c.getFullName(), c.getEmail()))
                            .toList());
        }
        return response;
    }

    private CouponResponse toResponseForCustomer(Coupon coupon, Long customerId) {
        CouponResponse response = toResponse(coupon);
        if (customerId == null || coupon.getMaxUsesPerUser() == null) {
            return response;
        }

        long used = orderRepository.countByUserIdAndCouponId(customerId, coupon.getCouponId());
        long remaining = Math.max(0L, (long) coupon.getMaxUsesPerUser() - used);
        response.setUsedByCurrentUser(used);
        response.setRemainingUsesForCurrentUser(remaining);
        if (remaining == 0) {
            response.setValid(false);
        }
        return response;
    }

    private String usageLimitMessage(Coupon coupon, long used) {
        long limit = coupon.getMaxUsesPerUser();
        return "Bạn đã sử dụng đủ " + Math.min(used, limit) + "/" + limit
                + " lượt cho mã giảm giá " + coupon.getCode();
    }
}
