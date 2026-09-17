package com.base.service.impl;

import com.base.config.ModelMapperConfig;
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
import com.base.exception.UnauthorizedException;
import com.base.repository.CouponRepository;
import com.base.repository.CustomerRepository;
import com.base.repository.OrderRepository;
import com.base.queue.EmailProducer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CouponServiceImplTest {

    @Mock private CouponRepository couponRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private EmailProducer emailProducer;

    private CouponServiceImpl couponService;

    @BeforeEach
    void setUp() {
        couponService = new CouponServiceImpl(
                couponRepository,
                orderRepository,
                customerRepository,
                new ModelMapperConfig().modelMapper(),
                emailProducer
        );
    }

    @Test
    void create_shouldTreatBlankQuantityAsUnlimitedAndActive() {
        CouponRequest request = validRequest();
        request.setTotalQuantity(null);
        request.setMaxUsesPerUser(null);

        when(couponRepository.existsByCode("SAVE10")).thenReturn(false);
        when(couponRepository.save(any(Coupon.class)))
                .thenAnswer(invocation -> {
                    Coupon saved = invocation.getArgument(0);
                    saved.setCouponId(1L);
                    return saved;
                });

        CouponResponse response = couponService.create(request);

        assertEquals(CouponStatus.ACTIVE, response.getStatus());
        assertTrue(response.isValid());
        assertNull(response.getTotalQuantity());
        assertNull(response.getRemainingQuantity());
    }

    @Test
    void update_shouldClearExistingQuantityLimitsWhenFieldsAreBlank() {
        Coupon existing = Coupon.builder()
                .couponId(1L)
                .code("SAVE10")
                .description("Giảm 10%")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.TEN)
                .maxDiscountAmount(new BigDecimal("100000"))
                .totalQuantity(5)
                .usedQuantity(5)
                .maxUsesPerUser(1)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .status(CouponStatus.EXPIRED)
                .couponType(CouponType.PUBLIC)
                .targetedCustomers(new HashSet<>())
                .build();
        CouponRequest request = validRequest();
        request.setTotalQuantity(null);
        request.setMaxUsesPerUser(null);

        when(couponRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(couponRepository.save(existing)).thenReturn(existing);

        CouponResponse response = couponService.update(1L, request);

        assertNull(existing.getTotalQuantity());
        assertNull(existing.getMaxUsesPerUser());
        assertEquals(CouponStatus.ACTIVE, response.getStatus());
        assertTrue(response.isValid());
    }

    @Test
    void create_shouldRejectPerUserLimitAboveTotalQuantity() {
        CouponRequest request = validRequest();
        request.setTotalQuantity(5);
        request.setMaxUsesPerUser(6);

        assertThrows(BadRequestException.class,
                () -> couponService.create(request));
    }

    @Test
    void create_shouldRequireMaxDiscountForPercentageCoupon() {
        CouponRequest request = validRequest();
        request.setMaxDiscountAmount(null);

        assertThrows(BadRequestException.class,
                () -> couponService.create(request));
    }

    @Test
    void createPersonalCoupon_shouldEmailAssignedCustomer() {
        Customer customer = Customer.builder()
                .customerId(11L)
                .email("customer@example.com")
                .fullName("Khách hàng")
                .build();
        CouponRequest request = validRequest();
        request.setCouponType(CouponType.PERSONAL);
        request.setTargetedCustomerIds(List.of(11L));

        when(couponRepository.existsByCode("SAVE10")).thenReturn(false);
        when(customerRepository.findAllById(anySet())).thenReturn(List.of(customer));
        when(couponRepository.save(any(Coupon.class))).thenAnswer(invocation -> invocation.getArgument(0));

        couponService.create(request);

        ArgumentCaptor<EmailMessage> emailCaptor = ArgumentCaptor.forClass(EmailMessage.class);
        verify(emailProducer).sendAfterCommit(emailCaptor.capture());
        assertEquals(EmailType.PERSONAL_COUPON_ASSIGNED, emailCaptor.getValue().getType());
        assertEquals("customer@example.com", emailCaptor.getValue().getTo());
        assertEquals("SAVE10", emailCaptor.getValue().getData().get("couponCode"));
    }

    @Test
    void updatePersonalCoupon_shouldEmailAddedAndRemovedCustomers() {
        Customer removedCustomer = Customer.builder()
                .customerId(11L).email("removed@example.com").fullName("Khách cũ").build();
        Customer addedCustomer = Customer.builder()
                .customerId(12L).email("added@example.com").fullName("Khách mới").build();
        Coupon existing = Coupon.builder()
                .couponId(1L)
                .code("SAVE10")
                .description("Giảm 10%")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.TEN)
                .maxDiscountAmount(new BigDecimal("100000"))
                .usedQuantity(0)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .status(CouponStatus.ACTIVE)
                .couponType(CouponType.PERSONAL)
                .targetedCustomers(new HashSet<>(List.of(removedCustomer)))
                .build();
        CouponRequest request = validRequest();
        request.setCouponType(CouponType.PERSONAL);
        request.setTargetedCustomerIds(List.of(12L));

        when(couponRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(customerRepository.findAllById(anySet())).thenReturn(List.of(addedCustomer));
        when(couponRepository.save(existing)).thenReturn(existing);

        couponService.update(1L, request);

        ArgumentCaptor<EmailMessage> emailCaptor = ArgumentCaptor.forClass(EmailMessage.class);
        verify(emailProducer, times(2)).sendAfterCommit(emailCaptor.capture());
        List<EmailMessage> messages = emailCaptor.getAllValues();
        assertTrue(messages.stream().anyMatch(message -> message.getType() == EmailType.PERSONAL_COUPON_ASSIGNED
                && message.getTo().equals("added@example.com")));
        assertTrue(messages.stream().anyMatch(message -> message.getType() == EmailType.PERSONAL_COUPON_UNAVAILABLE
                && message.getTo().equals("removed@example.com")));
    }

    @Test
    void activePersonalCoupon_shouldRemainVisibleButDisabledAfterUserReachesLimit() {
        Coupon coupon = Coupon.builder()
                .couponId(7L)
                .code("VIP3")
                .description("Mã cá nhân")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000"))
                .usedQuantity(3)
                .maxUsesPerUser(3)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .status(CouponStatus.ACTIVE)
                .couponType(CouponType.PERSONAL)
                .targetedCustomers(new HashSet<>())
                .build();

        when(couponRepository.filterCoupons(
                isNull(), eq(true), eq(false), eq(false), eq(true), eq(false),
                eq(CouponType.PUBLIC), isNull(), isNull(), isNull(),
                any(LocalDateTime.class), any(org.springframework.data.domain.Pageable.class)
        )).thenReturn(org.springframework.data.domain.Page.empty());
        when(couponRepository.findPersonalCouponsForCustomer(11L)).thenReturn(List.of(coupon));
        when(orderRepository.countByUserIdAndCouponId(11L, 7L)).thenReturn(3L);

        List<CouponResponse> responses = couponService.getActiveCouponsForUser(11L);

        assertEquals(1, responses.size());
        CouponResponse response = responses.get(0);
        assertFalse(response.isValid());
        assertEquals(3L, response.getUsedByCurrentUser());
        assertEquals(0L, response.getRemainingUsesForCurrentUser());
    }

    @Test
    void validate_shouldReturnSpecificMessageAfterUserReachesLimit() {
        Coupon coupon = Coupon.builder()
                .couponId(7L)
                .code("VIP3")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000"))
                .usedQuantity(3)
                .maxUsesPerUser(3)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .status(CouponStatus.ACTIVE)
                .couponType(CouponType.PERSONAL)
                .targetedCustomers(new HashSet<>())
                .build();
        ValidateCouponRequest request = new ValidateCouponRequest();
        request.setCode("VIP3");
        request.setOrderAmount(new BigDecimal("500000"));

        when(couponRepository.findByCode("VIP3")).thenReturn(Optional.of(coupon));
        when(couponRepository.isCustomerEligible(7L, 11L)).thenReturn(true);
        when(orderRepository.countByUserIdAndCouponId(11L, 7L)).thenReturn(3L);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> couponService.validate(request, 11L)
        );

        assertEquals(
                "Bạn đã sử dụng đủ 3/3 lượt cho mã giảm giá VIP3",
                exception.getMessage()
        );
    }

    @Test
    void validatePersonalCoupon_shouldReturnSpecificUnauthorizedMessageForGuest() {
        Coupon coupon = Coupon.builder()
                .couponId(7L)
                .code("VIP3")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000"))
                .usedQuantity(0)
                .maxUsesPerUser(3)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .status(CouponStatus.ACTIVE)
                .couponType(CouponType.PERSONAL)
                .targetedCustomers(new HashSet<>())
                .build();
        ValidateCouponRequest request = new ValidateCouponRequest();
        request.setCode("VIP3");
        request.setOrderAmount(new BigDecimal("500000"));
        when(couponRepository.findByCode("VIP3")).thenReturn(Optional.of(coupon));

        UnauthorizedException exception = assertThrows(
                UnauthorizedException.class,
                () -> couponService.validate(request, null)
        );

        assertEquals(
                "Vui lòng đăng nhập để sử dụng mã giảm giá cá nhân VIP3",
                exception.getMessage()
        );
    }

    private CouponRequest validRequest() {
        CouponRequest request = new CouponRequest();
        request.setCode("SAVE10");
        request.setDescription("Giảm 10%");
        request.setDiscountType(DiscountType.PERCENTAGE);
        request.setDiscountValue(BigDecimal.TEN);
        request.setMaxDiscountAmount(new BigDecimal("100000"));
        request.setCouponType(CouponType.PUBLIC);
        request.setStatus(CouponStatus.ACTIVE);
        request.setStartDate(LocalDateTime.now().minusDays(1));
        request.setEndDate(LocalDateTime.now().plusDays(1));
        return request;
    }
}
