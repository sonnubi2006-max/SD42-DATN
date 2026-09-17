package com.base.service.impl;

import com.base.dto.event.EmailMessage;
import com.base.dto.request.order.*;
import com.base.dto.response.order.OrderResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.dto.response.order.PriceChangeResponse;
import com.base.dto.response.order.ProductSalesStatisticResponse;
import com.base.dto.response.order.StaffSalesStatisticResponse;
import com.base.dto.response.order.TopRatedProductStatisticResponse;
import com.base.entity.*;
import com.base.enums.*;
import com.base.exception.BadRequestException;
import com.base.exception.ForbiddenException;
import com.base.exception.InsufficientStockException;
import com.base.exception.PriceChangedException;
import com.base.exception.ResourceNotFoundException;
import com.base.mapper.OrderMapper;
import com.base.queue.EmailProducer;
import com.base.repository.*;
import com.base.service.CustomerService;
import com.base.service.OrderService;
import com.base.service.PaymentService;
import com.base.service.helper.OrderCodeGenerator;
import com.base.service.helper.OrderPriceCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final Set<OrderStatus> EVIDENCE_REQUIRED_STATUSES = Set.of(
            OrderStatus.FAILED_DELIVERY,
            OrderStatus.RETURNING,
            OrderStatus.CANCELED_BY_DAMAGED
    );
    private static final Set<OrderStatus> CUSTOMER_CANCELLABLE_STATUSES = Set.of(
            OrderStatus.PENDING,
            OrderStatus.WAITING_STOCK,
            OrderStatus.WAITING_PAYMENT
    );
    private static final Set<String> ALLOWED_EVIDENCE_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final int MAX_EVIDENCE_IMAGES = 5;
    private static final long MAX_EVIDENCE_IMAGE_SIZE = 5L * 1024L * 1024L;

    @Override
    @Transactional(readOnly = true)
    public List<ProductSalesStatisticResponse> getProductSalesStatistics(LocalDateTime fromDate, LocalDateTime toDate) {
        return productRepository.findAllProductSalesStatistics(fromDate, toDate).stream()
                .map(item -> new ProductSalesStatisticResponse(
                        item.getProductId(), item.getProductName(), item.getQuantity(), item.getRevenue()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffSalesStatisticResponse> getStaffSalesStatistics(LocalDateTime fromDate, LocalDateTime toDate) {
        return orderRepository.findStaffSalesStatistics(fromDate, toDate).stream()
                .map(item -> new StaffSalesStatisticResponse(item.getStaffId(), item.getStaffName(),
                        item.getOrderCount(), item.getRevenue()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopRatedProductStatisticResponse> getTopRatedProductStatistics(
            LocalDateTime fromDate, LocalDateTime toDate, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        return reviewRepository.findTopRatedProductStatistics(
                        fromDate, toDate, PageRequest.of(0, safeLimit))
                .stream()
                .map(item -> new TopRatedProductStatisticResponse(
                        item.getProductId(),
                        item.getProductName(),
                        item.getAverageRating(),
                        item.getReviewCount()))
                .toList();
    }

    private final OrderRepository                orderRepository;
    private final OrderDetailRepository          orderDetailRepository;
    private final ProductVariantRepository       variantRepository;
    private final ProductRepository              productRepository;
    private final ReviewRepository               reviewRepository;
    private final CouponRepository               couponRepository;
    private final UserRepository                 userRepository;
    private final PromotionRepository            promotionRepository;
    private final CustomerRepository             customerRepository;
    private final ReservationRepository          reservationRepository;
    private final CustomerService                customerService;
    private final OrderTransactionLogRepository  orderTransactionLogRepository;
    private final OrderTransactionLogImageRepository orderTransactionLogImageRepository;

    private final OrderMapper          orderMapper;
    private final OrderCodeGenerator   codeGenerator;
    private final OrderPriceCalculator calculator;
    private final ModelMapper          modelMapper;
    private final EmailProducer        emailProducer;
    private final PaymentRepository    paymentRepository;
    private final RedisInventoryClaimService redisInventoryClaimService;
    private final CloudinaryService cloudinaryService;

    @Autowired
    @Lazy
    private PaymentService paymentService;

    @Autowired
    @Lazy
    private OrderService self;

    @Override
    @Transactional
    public OrderResponse createOnlineOrder(CreateOrderOnlineRequest request, Long userId) {
        if (request.getOrderType() != OrderType.ONLINE) {
            throw new BadRequestException("Endpoint này chỉ dùng để tạo đơn ONLINE");
        }

        boolean guestOrder = userId == null;
        if (guestOrder && !Boolean.TRUE.equals(request.getIsGuest())) {
            throw new BadRequestException("Vui lòng đăng nhập hoặc xác nhận đặt hàng với tư cách khách vãng lai");
        }
        String guestName = guestOrder ? trimToNull(request.getGuestName()) : null;
        String guestEmail = guestOrder ? trimToNull(request.getGuestEmail()) : null;
        String guestPhone = guestOrder ? trimToNull(request.getGuestPhone()) : null;
        if (guestOrder && guestName == null) {
            throw new BadRequestException("Tên người đặt không được để trống");
        }
        if (guestOrder && guestEmail == null) {
            throw new BadRequestException("Email người đặt không được để trống");
        }
        if (guestOrder && guestPhone == null) {
            throw new BadRequestException("Số điện thoại người đặt không được để trống");
        }
        if (guestEmail != null) {
            guestEmail = guestEmail.toLowerCase(Locale.ROOT);
        }
        if (request.getOrderAddressRequest() == null) {
            throw new BadRequestException("Thông tin nhận hàng không được để trống");
        }
        if (guestOrder
                && request.getPaymentMethod() != PaymentMethod.COD
                && request.getPaymentMethod() != PaymentMethod.VNPAY) {
            throw new BadRequestException(
                    "Khách vãng lai chỉ hỗ trợ thanh toán COD hoặc VNPay"
            );
        }

        Customer   customer   = userId != null ? resolveCustomer(userId) : null;
        Coupon coupon = request.getCoupon() == null
                ? null
                : resolveCoupon(request.getCoupon().getCouponId(), userId);

        List<Promotion> activePromotions = resolvePromotions(request.getPromotionId());

        List<OrderDetail> details = buildOrderDetails(request.getItems(), OrderType.ONLINE, activePromotions);

        BigDecimal totalAmount = calculator.calcTotalAmount(details);

        BigDecimal promotionOrderDiscount = calculator.calcPromotionOrderDiscount(totalAmount, activePromotions);

        BigDecimal amountAfterPromotion = totalAmount.subtract(promotionOrderDiscount);
        BigDecimal couponDiscount =
                calculator.calcCouponDiscount(amountAfterPromotion, coupon);

        BigDecimal requestDiscount = request.getCoupon() == null
                ? BigDecimal.ZERO
                : request.getCoupon().getDiscountAmount();

        if (couponDiscount.compareTo(requestDiscount) != 0) {
            throw new BadRequestException(String.format(
                    "Mã giảm giá '%s' (%s %s) có sự thay đổi về giá trị, vui lòng cập nhật lại!",
                    coupon.getCode(),
                    coupon.getDiscountValue(),
                    coupon.getDiscountType() == DiscountType.PERCENTAGE ? "%" : "VNĐ"
            ));
        }

        BigDecimal totalDiscount = calculator.calcTotalDiscount(promotionOrderDiscount, couponDiscount);

        BigDecimal shippingFee = request.getShippingFee() != null
                ? request.getShippingFee()
                : calculator.calcShippingFee(totalAmount, totalDiscount, OrderType.ONLINE);
        BigDecimal finalAmount = calculator.calcFinalAmount(totalAmount, totalDiscount, shippingFee);

        OrderAddress address = modelMapper.map(request.getOrderAddressRequest(), OrderAddress.class);

        Order order = Order.builder()
                .customer(customer)
                .guestName(guestName)
                .guestEmail(guestEmail)
                .guestPhone(guestPhone)
                .coupon(coupon)
                .couponCode(coupon != null ? coupon.getCode() : null)
                .orderCode(codeGenerator.generate())
                .orderType(OrderType.ONLINE)
                .paymentMethod(request.getPaymentMethod())
                .totalAmount(totalAmount)
                .discountAmount(totalDiscount)
                .shippingFee(shippingFee)
                .finalAmount(finalAmount)
                .note(request.getNote())
                .orderAddress(address)
                .orderStatus(request.getPaymentMethod() == PaymentMethod.VNPAY
                        ? OrderStatus.WAITING_PAYMENT
                        : request.getPaymentMethod() == PaymentMethod.COD
                                ? OrderStatus.PENDING
                                : OrderStatus.CONFIRMED)
                .build();

        if (address != null) {
            address.setOrder(order);
        }

        details.forEach(d -> d.setOrder(order));
        order.getOrderDetails().addAll(details);

        try {
            reserveCouponUsage(coupon);

            Order saved = orderRepository.save(order);

            if (saved.getOrderStatus() == OrderStatus.PENDING
                    && saved.getPaymentMethod() == PaymentMethod.COD) {
                reserveOnlineCodInventory(saved.getOrderDetails(), saved);
            } else {
                claimInventoryInstantly(saved.getOrderDetails(), saved.getOrderCode());
            }

            saveTransactionLog(
                    saved,
                    null,
                    saved.getOrderStatus(),
                    "Đặt hàng trực tuyến",
                    saved.getNote(),
                    customer != null ? customer.getFullName() : guestName
            );

            sendOrderConfirmationEmail(saved);

            log.info("[ONLINE] Tạo đơn: {} | userId={}", saved.getOrderCode(), userId);
            return orderMapper.toResponse(saved);
        } catch (RuntimeException ex) {
            if (order.getOrderStatus() != OrderStatus.PENDING
                    || order.getPaymentMethod() != PaymentMethod.COD) {
                releaseClaimedInventory(order);
            }
            throw ex;
        }
    }

    @Override
    @Transactional
    public OrderResponse createPosOrder(CreateOrderRequest request, Long staffId) {
        request.setOrderType(OrderType.POS);

        User     staff  = resolveUser(staffId);
        Coupon   coupon = resolveCoupon(request.getCouponId(), null);

        List<Promotion> activePromotions = resolvePromotions(request.getPromotionId());

        List<OrderDetail> details = buildOrderDetails(request.getItems(), OrderType.POS, activePromotions);

        BigDecimal totalAmount          = calculator.calcTotalAmount(details);
        BigDecimal promotionOrderDiscount = calculator.calcPromotionOrderDiscount(totalAmount, activePromotions);
        BigDecimal couponDiscount       = calculator.calcCouponDiscount(
                totalAmount.subtract(promotionOrderDiscount), coupon);
        BigDecimal totalDiscount        = calculator.calcTotalDiscount(promotionOrderDiscount, couponDiscount);
        BigDecimal finalAmount          = calculator.calcFinalAmount(totalAmount, totalDiscount, BigDecimal.ZERO);

        Order order = Order.builder()
                .staff(staff)
                .coupon(coupon)
                .couponCode(coupon != null ? coupon.getCode() : null)
                .orderCode(codeGenerator.generate())
                .orderType(OrderType.POS)
                .paymentMethod(request.getPaymentMethod())
                .totalAmount(totalAmount)
                .discountAmount(totalDiscount)
                .shippingFee(BigDecimal.ZERO)
                .finalAmount(finalAmount)
                .note(request.getNote())
                .orderStatus(OrderStatus.COMPLETED)
                .completedAt(LocalDateTime.now())
                .build();

        details.forEach(d -> d.setOrder(order));
        order.getOrderDetails().addAll(details);

        try {
            claimInventoryInstantly(order.getOrderDetails(), order.getOrderCode());

            reserveCouponUsage(coupon);

            Order saved = orderRepository.save(order);

            saveTransactionLog(
                    saved,
                    null,
                    saved.getOrderStatus(),
                    "Bán hàng tại quầy (Hoàn thành)",
                    saved.getNote(),
                    staff != null ? staff.getFullName() : "Nhân viên"
            );

            log.info("[POS] Tạo đơn: {} | staffId={}", saved.getOrderCode(), staffId);
            return orderMapper.toResponse(saved);
        } catch (RuntimeException ex) {
            releaseClaimedInventory(order);
            throw ex;
        }
    }

    @Override
    @Transactional
    public OrderResponse createPosDraft(Long staffId, Long shiftId) {
        User     staff = resolveUser(staffId);

        long currentDraftsCount = orderRepository.countDraftsByStaff(staffId, OrderStatus.DRAFT);
        if (currentDraftsCount >= 5) {
            throw new BadRequestException("Mỗi nhân viên chỉ được mở tối đa 5 đơn chờ tại quầy!");
        }

        Order order = Order.builder()
                .staff(staff)
                .orderCode(codeGenerator.generate())
                .orderType(OrderType.POS)
                .orderStatus(OrderStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .build();

        Order saved = orderRepository.save(order);

        saveTransactionLog(
                saved,
                null,
                saved.getOrderStatus(),
                "Tạo đơn chờ tại quầy",
                null,
                staff != null ? staff.getFullName() : "Nhân viên"
        );

        log.info("[POS] Mở đơn chờ {} | staffId={}", saved.getOrderCode(), staffId);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public List<OrderResponse> getPosDrafts(Long staffId) {
        List<Order> drafts = orderRepository.findDraftsByStaff(staffId, OrderStatus.DRAFT);
        ensureDraftInventoryDeducted(drafts);
        return drafts
                .stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public OrderResponse addPosItem(Long orderId, PosAddItemRequest request, Long staffId) {
        Order order = loadDraftOwnedBy(orderId, staffId);

        recalcDraftTotals(order);

        ProductVariant variant = variantRepository.findByIdForUpdate(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Biến thể không tồn tại"));
        Long variantId = variant.getVariantId();

        int addQty = request.getQuantity();

        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        Long categoryId = variant.getProduct().getCategory() != null ? variant.getProduct().getCategory().getCategoryId() : null;

        BigDecimal originalPrice = variant.getPrice();
        BigDecimal effectivePrice = calculator.applyPromotionToUnit(
                originalPrice,
                variant.getVariantId(),
                variant.getProduct().getProductId(),
                categoryId,
                activePromotions
        );
        BigDecimal salePrice = (effectivePrice != null && effectivePrice.compareTo(originalPrice) < 0) ? effectivePrice : null;

        OrderDetail existingSamePrice = order.getOrderDetails().stream()
                .filter(d -> d.getVariant() != null && d.getVariant().getVariantId().equals(variantId))
                .filter(d -> {
                    BigDecimal dEffective = (d.getSalePrice() != null && d.getSalePrice().compareTo(BigDecimal.ZERO) > 0)
                            ? d.getSalePrice()
                            : d.getPrice();
                    return effectivePrice.compareTo(dEffective) == 0;
                })
                .findFirst().orElse(null);

        variant = adjustDraftInventory(variant, addQty);

        if (existingSamePrice != null) {
            int newQty = existingSamePrice.getQuantity() + addQty;
            existingSamePrice.setQuantity(newQty);
            existingSamePrice.setSubtotal(effectivePrice.multiply(BigDecimal.valueOf(newQty)));

            int totalVariantQtyInOrder = order.getOrderDetails().stream()
                    .filter(d -> d.getVariant() != null && d.getVariant().getVariantId().equals(variantId))
                    .mapToInt(OrderDetail::getQuantity)
                    .sum();
            syncReservation(order, variant, totalVariantQtyInOrder);
        } else {
            String imageUrl = null;
            if (variant.getImage() != null) {
                imageUrl = variant.getImage().getImageUrl();
            } else if (variant.getProduct() != null &&
                    variant.getProduct().getImages() != null &&
                    !variant.getProduct().getImages().isEmpty()) {
                imageUrl = variant.getProduct().getImages().get(0).getImageUrl();
            }
            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .variant(variant)
                    .productName(variant.getProduct().getProductName())
                    .imageUrl(imageUrl)
                    .size(variant.getSize())
                    .color(variant.getColor())
                    .quantity(addQty)
                    .price(originalPrice)
                    .salePrice(salePrice)
                    .subtotal(effectivePrice.multiply(BigDecimal.valueOf(addQty)))
                    .build();
            order.getOrderDetails().add(detail);

            int totalVariantQtyInOrder = order.getOrderDetails().stream()
                    .filter(d -> d.getVariant() != null && d.getVariant().getVariantId().equals(variantId))
                    .mapToInt(OrderDetail::getQuantity)
                    .sum();
            syncReservation(order, variant, totalVariantQtyInOrder);
        }

        recalcDraftTotals(order);
        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse updatePosItem(Long orderId, Long detailId, PosUpdateItemRequest request, Long staffId) {
        Order order = loadDraftOwnedBy(orderId, staffId);

        recalcDraftTotals(order);

        OrderDetail detail = findDetail(order, detailId);

        ProductVariant productOrderDetail = variantRepository
                .findByIdForUpdate(detail.getVariant().getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại"));
        Long variantId = productOrderDetail.getVariantId();
        detail.setVariant(productOrderDetail);

        int delta = request.getQuantity() - detail.getQuantity();

        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        Long categoryId = productOrderDetail.getProduct().getCategory() != null ? productOrderDetail.getProduct().getCategory().getCategoryId() : null;
        BigDecimal currentUnitPrice = calculator.applyPromotionToUnit(
                productOrderDetail.getPrice(),
                productOrderDetail.getVariantId(),
                productOrderDetail.getProduct().getProductId(),
                categoryId,
                activePromotions
        );

        BigDecimal effectiveDetailPrice = (detail.getSalePrice() != null && detail.getSalePrice().compareTo(BigDecimal.ZERO) > 0)
                ? detail.getSalePrice()
                : detail.getPrice();

        if (delta > 0 && currentUnitPrice.compareTo(effectiveDetailPrice) != 0) {
            throw new BadRequestException("Giá của sản phẩm đã có sự thay đổi!");
        }

        productOrderDetail = adjustDraftInventory(productOrderDetail, delta);
        detail.setVariant(productOrderDetail);

        detail.setQuantity(request.getQuantity());
        detail.setSubtotal(effectiveDetailPrice.multiply(BigDecimal.valueOf(request.getQuantity())));
        int totalVariantQtyInOrder = order.getOrderDetails().stream()
                .filter(d -> d.getVariant() != null
                        && d.getVariant().getVariantId().equals(variantId))
                .mapToInt(OrderDetail::getQuantity)
                .sum();
        syncReservation(order, productOrderDetail, totalVariantQtyInOrder);

        recalcDraftTotals(order);
        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse removePosItem(Long orderId, Long detailId, Long staffId) {
        Order order = loadDraftOwnedBy(orderId, staffId);
        OrderDetail detail = findDetail(order, detailId);

        ProductVariant variant = variantRepository
                .findByIdForUpdate(detail.getVariant().getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại"));
        Long variantId = variant.getVariantId();

        variant = adjustDraftInventory(variant, -detail.getQuantity());

        order.getOrderDetails().remove(detail); 
        int remainingVariantQty = order.getOrderDetails().stream()
                .filter(d -> d.getVariant() != null
                        && d.getVariant().getVariantId().equals(variantId))
                .mapToInt(OrderDetail::getQuantity)
                .sum();
        syncReservation(order, variant, remainingVariantQty);

        recalcDraftTotals(order);
        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse attachPosCustomer(Long orderId, PosAttachCustomerRequest request, Long staffId) {
        Order order = loadDraftOwnedBy(orderId, staffId);

        if (Boolean.TRUE.equals(request.getClear())) {
            order.setCustomer(null);
        } else if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new BadRequestException(
                            "Không tìm thấy khách hàng: " + request.getCustomerId()));
            bindCustomer(order, customer);
        } else if (!isBlank(request.getEmail()) || !isBlank(request.getFullName()) || !isBlank(request.getPhone())) {
            Customer customer = customerService.findOrCreateByEmail(
                    request.getEmail(), request.getFullName(), request.getPhone());
            bindCustomer(order, customer);
        } else {
            throw new BadRequestException("Cần cung cấp customerId hoặc thông tin khách (email/tên/sđt)");
        }

        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse checkoutPosOrder(Long orderId, PosCheckoutRequest request, Long staffId) {
        if (request.getPaymentMethod() != PaymentMethod.CASH
                && request.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            throw new BadRequestException(
                    "Bán hàng tại quầy chỉ hỗ trợ tiền mặt hoặc chuyển khoản");
        }

        boolean isDelivery = Boolean.TRUE.equals(request.getDelivery());
        if (isDelivery && request.getOrderAddressRequest() == null) {
            throw new BadRequestException(
                    "Thông tin nhận hàng không được để trống khi chọn giao hàng");
        }

        Order order = loadDraftOwnedBy(orderId, staffId);

        if (order.getOrderDetails().isEmpty()) {
            throw new BadRequestException("Đơn chưa có sản phẩm, không thể thanh toán");
        }

        Long customerId = order.getCustomer() != null ? order.getCustomer().getCustomerId() : null;
        Coupon coupon;
        if (request.getCouponId() != null) {
            if (request.getCouponId().equals(-1L)) {
                coupon = null;
            } else {
                coupon = resolveCoupon(request.getCouponId(), customerId);
            }
        } else {
            coupon = order.getCoupon();
        }

        List<OrderDetail> details = order.getOrderDetails();
        BigDecimal totalAmount = calculator.calcTotalAmount(details);
        BigDecimal promotionOrderDiscount = calculator.calcPromotionOrderDiscount(totalAmount, order.getOrderType() == OrderType.POS || order.getOrderType() == OrderType.POS_SHIP
                ? resolvePromotions(null)
                : List.of());
        BigDecimal couponDiscount = calculator.calcCouponDiscount(totalAmount.subtract(promotionOrderDiscount), coupon);
        BigDecimal totalDiscount = calculator.calcTotalDiscount(promotionOrderDiscount, couponDiscount);
        BigDecimal finalAmount = calculator.calcFinalAmount(totalAmount, totalDiscount, BigDecimal.ZERO);

        order.setCoupon(coupon);
        order.setCouponCode(coupon != null ? coupon.getCode() : null);
        if (request.getNote() != null) order.setNote(request.getNote());
        order.setTotalAmount(totalAmount);
        order.setDiscountAmount(totalDiscount);

        BigDecimal shippingFee = isDelivery && request.getShippingFee() != null
                ? request.getShippingFee() : BigDecimal.ZERO;
        order.setShippingFee(shippingFee);

        BigDecimal finalAmountWithShipping = calculator.calcFinalAmount(totalAmount, totalDiscount, shippingFee);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setFinalAmount(finalAmountWithShipping);
        order.setOrderDate(LocalDateTime.now());

        if (isDelivery) {

            OrderAddress address = modelMapper.map(
                    request.getOrderAddressRequest(),
                    OrderAddress.class
            );

            address.setOrder(order);
            order.setOrderAddress(address);

            order.setOrderStatus(OrderStatus.CONFIRMED);
            order.setOrderType(OrderType.POS_SHIP);
        } else {

            order.setOrderStatus(OrderStatus.COMPLETED);
            order.setCompletedAt(LocalDateTime.now());
        }

        completeDraftInventory(order);

        reserveCouponUsage(coupon);

        Order saved = orderRepository.save(order);

        saveTransactionLog(
                saved,
                OrderStatus.DRAFT,
                saved.getOrderStatus(),
                "Thanh toán đơn chờ (Hoàn thành)",
                saved.getNote(),
                saved.getStaff() != null ? saved.getStaff().getFullName() : "Nhân viên"
        );

        log.info("[POS] Hoàn tất đơn {} | staffId={} | final={}",
                saved.getOrderCode(), staffId, finalAmount);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse cancelPosDraft(Long orderId, Long staffId) {
        Order order = loadDraftOwnedBy(orderId, staffId);

        if (order.getOrderDetails() != null) {
            for (OrderDetail d : order.getOrderDetails()) {
                if (d.getVariant() == null) continue;
                ProductVariant variant = variantRepository
                        .findByIdForUpdate(d.getVariant().getVariantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại"));
                adjustDraftInventory(variant, -d.getQuantity());
            }
        }
        reservationRepository.findByOrder_OrderIdAndStatus(orderId, Reservation.ReservationStatus.ACTIVE)
                .forEach(r -> r.setStatus(Reservation.ReservationStatus.RELEASED));

        OrderResponse response = orderMapper.toResponse(order);
        response.setOrderStatus(OrderStatus.CANCELLED);

        orderRepository.delete(order);
        log.info("[POS] Xóa/Hủy hoàn toàn đơn chờ {} | staffId={}", order.getOrderCode(), staffId);
        return response;
    }

    private void claimInventoryInstantly(List<OrderDetail> details, String claimantKey) {
        List<ClaimedInventoryChange> claimed = new ArrayList<>();
        Map<Long, Integer> originalStockByVariantId = new HashMap<>();
        Map<Long, Integer> requestedByVariant = details.stream()
                .filter(detail -> detail.getVariant() != null
                        && detail.getQuantity() != null
                        && detail.getQuantity() > 0)
                .collect(Collectors.toMap(
                        detail -> detail.getVariant().getVariantId(),
                        OrderDetail::getQuantity,
                        Integer::sum
                ));

        try {
            for (Map.Entry<Long, Integer> request : requestedByVariant.entrySet()) {
                ProductVariant lockedVariant = variantRepository.findByIdForUpdate(request.getKey())
                        .orElseThrow(() -> new BadRequestException(
                                "Biến thể sản phẩm không còn tồn tại: " + request.getKey()));
                ProductVariant variant = normalizePosReservedInventory(lockedVariant);
                int requestedQuantity = request.getValue();

                redisInventoryClaimService.synchronizeStock(
                        variant.getVariantId(), variant.getStockQuantity());
                boolean claimedNow = redisInventoryClaimService.claimStock(
                        variant.getVariantId(), claimantKey, requestedQuantity);
                if (!claimedNow) {
                    throw new InsufficientStockException(
                            formatVariantName(variant), requestedQuantity, variant.getStockQuantity());
                }

                claimed.add(new ClaimedInventoryChange(variant.getVariantId(), requestedQuantity));
                originalStockByVariantId.putIfAbsent(variant.getVariantId(), variant.getStockQuantity());

                int newStock = variant.getStockQuantity() - requestedQuantity;
                if (newStock < 0) {
                    throw new InsufficientStockException(
                            formatVariantName(variant), requestedQuantity, variant.getStockQuantity());
                }

                variant.setStockQuantity(newStock);
                variantRepository.save(variant);
                details.stream()
                        .filter(detail -> detail.getVariant() != null
                                && variant.getVariantId().equals(detail.getVariant().getVariantId()))
                        .forEach(detail -> detail.setVariant(variant));
            }
        } catch (RuntimeException ex) {
            releaseClaimedInventory(claimed, claimantKey);
            for (Map.Entry<Long, Integer> entry : originalStockByVariantId.entrySet()) {
                ProductVariant variant = variantRepository.findById(entry.getKey()).orElse(null);
                if (variant != null) {
                    variant.setStockQuantity(entry.getValue());
                    variantRepository.save(variant);
                }
            }
            throw ex;
        }
    }

    private void releaseClaimedInventory(Order order) {
        if (order == null || order.getOrderDetails() == null) return;
        Map<Long, Integer> quantities = order.getOrderDetails().stream()
                .filter(detail -> detail.getVariant() != null
                        && detail.getQuantity() != null
                        && detail.getQuantity() > 0)
                .collect(Collectors.toMap(
                        detail -> detail.getVariant().getVariantId(),
                        OrderDetail::getQuantity,
                        Integer::sum
                ));
        Map<Long, ProductVariant> variants = order.getOrderDetails().stream()
                .filter(detail -> detail.getVariant() != null)
                .collect(Collectors.toMap(
                        detail -> detail.getVariant().getVariantId(),
                        OrderDetail::getVariant,
                        (first, ignored) -> first
                ));

        quantities.forEach((variantId, quantity) -> {
            boolean released = redisInventoryClaimService.releaseStock(
                    variantId, order.getOrderCode(), quantity);
            if (!released) return;

            ProductVariant variant = variants.get(variantId);
            variant.setStockQuantity(variant.getStockQuantity() + quantity);
            variantRepository.save(variant);
        });
    }

    private void releaseClaimedInventory(List<ClaimedInventoryChange> claimed, String claimantKey) {
        for (ClaimedInventoryChange change : claimed) {
            boolean released = redisInventoryClaimService.releaseStock(
                    change.variantId(), claimantKey, change.quantity());
            if (!released) continue;

            ProductVariant variant = variantRepository.findById(change.variantId()).orElse(null);
            if (variant != null) {
                variant.setStockQuantity(variant.getStockQuantity() + change.quantity());
                variantRepository.save(variant);
            }
        }
    }

    private void releaseClaimedInventoryForDamagedOrder(Order order,
                                                       List<UpdateOrderStatusRequest.DamagedItemRequest> damagedItems) {
        if (order == null || order.getOrderDetails() == null || damagedItems == null || damagedItems.isEmpty()) {
            throw new BadRequestException("Phải khai báo số lượng hàng hỏng cho từng sản phẩm");
        }

        Map<Long, Integer> damagedMap = new HashMap<>();
        for (UpdateOrderStatusRequest.DamagedItemRequest item : damagedItems) {
            if (item.getVariantId() == null || item.getDamagedQuantity() == null) {
                throw new BadRequestException("Thông tin sản phẩm hỏng không đầy đủ");
            }
            if (damagedMap.putIfAbsent(item.getVariantId(), item.getDamagedQuantity()) != null) {
                throw new BadRequestException(
                        "Sản phẩm bị khai báo hỏng nhiều lần: " + item.getVariantId());
            }
        }

        List<ClaimedInventoryChange> toRelease = new ArrayList<>();
        Set<Long> orderVariantIds = new HashSet<>();
        int totalDamagedQuantity = 0;
        for (OrderDetail detail : order.getOrderDetails()) {
            ProductVariant variant = detail.getVariant();
            if (variant == null || detail.getQuantity() == null || detail.getQuantity() <= 0) {
                continue;
            }

            Long variantId = variant.getVariantId();
            orderVariantIds.add(variantId);
            Integer damagedQty = damagedMap.get(variantId);
            if (damagedQty == null) {
                throw new BadRequestException(
                        "Chưa khai báo số lượng hỏng cho sản phẩm: " + detail.getProductName());
            }
            if (damagedQty < 0 || damagedQty > detail.getQuantity()) {
                throw new BadRequestException(String.format(
                        "Số lượng hỏng của '%s' phải từ 0 đến %d",
                        detail.getProductName(), detail.getQuantity()));
            }

            detail.setDamagedQuantity(damagedQty);
            totalDamagedQuantity += damagedQty;
            int undamagedQty = detail.getQuantity() - damagedQty;
            if (undamagedQty > 0) {
                toRelease.add(new ClaimedInventoryChange(variantId, undamagedQty));
            }
        }

        if (!orderVariantIds.containsAll(damagedMap.keySet())) {
            throw new BadRequestException("Danh sách hàng hỏng chứa sản phẩm không thuộc đơn hàng");
        }
        if (totalDamagedQuantity == 0) {
            throw new BadRequestException(
                    "Đơn hủy do hỏng hàng phải có ít nhất một sản phẩm bị hỏng");
        }

        releaseClaimedInventory(toRelease, order.getOrderCode());
    }

    private record ClaimedInventoryChange(Long variantId, int quantity) {
    }

    private Order loadDraftOwnedBy(Long orderId, Long staffId) {
        Order order = findWithDetails(orderId);
        if (order.getOrderType() != OrderType.POS || order.getOrderStatus() != OrderStatus.DRAFT) {
            throw new BadRequestException("Đơn không ở trạng thái chờ (DRAFT) tại quầy");
        }
        User staff = resolveUser(staffId);
        boolean isAdmin = staff.getRole() == RoleUser.ADMIN;
        if (!isAdmin && (order.getStaff() == null || !order.getStaff().getUserId().equals(staffId))) {
            throw new ForbiddenException("Đơn chờ không thuộc về bạn");
        }
        ensureDraftInventoryDeducted(List.of(order));
        return order;
    }

    private void ensureDraftInventoryDeducted(Collection<Order> drafts) {
        SortedSet<Long> variantIds = drafts.stream()
                .filter(Objects::nonNull)
                .flatMap(order -> order.getOrderDetails() == null
                        ? Stream.<OrderDetail>empty()
                        : order.getOrderDetails().stream())
                .filter(detail -> detail.getVariant() != null)
                .map(detail -> detail.getVariant().getVariantId())
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(TreeSet::new));

        for (Long variantId : variantIds) {
            ProductVariant variant = variantRepository.findByIdForUpdate(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại"));
            normalizePosReservedInventory(variant);
        }
    }

    private void reserveOnlineCodInventory(List<OrderDetail> details, Order order) {
        Map<Long, Integer> requestedByVariant = details.stream()
                .filter(detail -> detail.getVariant() != null
                        && detail.getQuantity() != null
                        && detail.getQuantity() > 0)
                .collect(Collectors.toMap(
                        detail -> detail.getVariant().getVariantId(),
                        OrderDetail::getQuantity,
                        Integer::sum
                ));

        for (Map.Entry<Long, Integer> request : requestedByVariant.entrySet()) {
            ProductVariant variant = variantRepository.findByIdForUpdate(request.getKey())
                    .orElseThrow(() -> new BadRequestException(
                            "Biến thể sản phẩm không còn tồn tại: " + request.getKey()));
            int requestedQuantity = request.getValue();
            int onlineHeldQuantity = reservationRepository
                    .sumActiveOnlineQuantityByVariantId(variant.getVariantId());
            int availableForOnline = Math.max(0,
                    variant.getStockQuantity() - onlineHeldQuantity);

            if (availableForOnline < requestedQuantity) {
                throw new InsufficientStockException(
                        formatVariantName(variant), requestedQuantity, availableForOnline);
            }

            syncReservation(order, variant, requestedQuantity);
            details.stream()
                    .filter(detail -> detail.getVariant() != null
                            && variant.getVariantId().equals(detail.getVariant().getVariantId()))
                    .forEach(detail -> detail.setVariant(variant));
        }
    }

    private String formatVariantName(ProductVariant variant) {
        return String.format("%s (%s - %s)",
                variant.getProduct().getProductName(), variant.getSize(), variant.getColor());
    }

    private OrderDetail findDetail(Order order, Long detailId) {
        return order.getOrderDetails().stream()
                .filter(d -> d.getOrderDetailId() != null && d.getOrderDetailId().equals(detailId))
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "Không tìm thấy dòng sản phẩm: " + detailId));
    }

    private ProductVariant adjustDraftInventory(ProductVariant variant, int delta) {
        if (variant == null) return null;
        variant = normalizePosReservedInventory(variant);
        if (delta == 0) return variant;
        int availableQuantity = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
        int reservedQuantity = variant.getReservedQuantity() != null ? variant.getReservedQuantity() : 0;
        if (delta > 0 && availableQuantity < delta) {
            throw new BadRequestException(String.format(
                    "Sản phẩm '%s' (%s - %s) không đủ hàng. Cần thêm: %d, còn: %d",
                    variant.getProduct().getProductName(), variant.getSize(), variant.getColor(),
                    delta, availableQuantity));
        }

        variant.setStockQuantity(availableQuantity - delta);
        variant.setReservedQuantity(Math.max(0, reservedQuantity + delta));
        return variantRepository.save(variant);
    }

    private ProductVariant normalizePosReservedInventory(ProductVariant variant) {
        int activePosReservations = reservationRepository
                .sumActivePosQuantityByVariantId(variant.getVariantId());
        int deductedReservations = variant.getReservedQuantity() != null
                ? variant.getReservedQuantity() : 0;
        if (deductedReservations == activePosReservations) {
            return variant;
        }

        int currentStock = variant.getStockQuantity() != null
                ? variant.getStockQuantity() : 0;
        int correctedStock = currentStock + deductedReservations - activePosReservations;
        if (correctedStock < 0) {
            throw new BadRequestException(String.format(
                    "Không đủ tồn kho để đồng bộ đơn tại quầy cho sản phẩm '%s' (%s - %s). Cần giữ: %d, kho hiện tại: %d",
                    variant.getProduct().getProductName(), variant.getSize(), variant.getColor(),
                    activePosReservations, currentStock + deductedReservations));
        }
        variant.setStockQuantity(correctedStock);
        variant.setReservedQuantity(activePosReservations);
        return variantRepository.save(variant);
    }

    private void syncReservation(Order order, ProductVariant variant, int newQty) {
        Reservation r = reservationRepository
                .findByOrder_OrderIdAndVariant_VariantIdAndStatus(
                        order.getOrderId(), variant.getVariantId(), Reservation.ReservationStatus.ACTIVE)
                .orElse(null);
        if (newQty <= 0) {
            if (r != null) {
                r.setStatus(Reservation.ReservationStatus.RELEASED);
                reservationRepository.save(r);
            }
            return;
        }
        if (r == null) {
            r = Reservation.builder()
                    .order(order)
                    .variant(variant)
                    .quantity(newQty)
                    .status(Reservation.ReservationStatus.ACTIVE)
                    .build();
        } else {
            r.setQuantity(newQty);
        }
        reservationRepository.save(r);
    }

    private void completeDraftInventory(Order order) {
        Map<Long, Integer> quantities = order.getOrderDetails().stream()
                .filter(detail -> detail.getVariant() != null
                        && detail.getQuantity() != null
                        && detail.getQuantity() > 0)
                .collect(Collectors.toMap(
                        detail -> detail.getVariant().getVariantId(),
                        OrderDetail::getQuantity,
                        Integer::sum));
        quantities.forEach((variantId, quantity) -> {
            ProductVariant variant = variantRepository.findByIdForUpdate(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại"));
            int reservedQuantity = variant.getReservedQuantity() != null
                    ? variant.getReservedQuantity() : 0;
            variant.setReservedQuantity(Math.max(0, reservedQuantity - quantity));
            variantRepository.save(variant);
        });
        reservationRepository.findByOrder_OrderIdAndStatus(
                        order.getOrderId(), Reservation.ReservationStatus.ACTIVE)
                .forEach(r -> r.setStatus(Reservation.ReservationStatus.COMPLETED));
    }

    private void bindCustomer(Order order, Customer customer) {
        order.setCustomer(customer);
    }

    private void recalcDraftTotals(Order order) {
        for (OrderDetail detail : order.getOrderDetails()) {
            if (detail.getQuantity() != null) {
                BigDecimal effectivePrice = (detail.getSalePrice() != null && detail.getSalePrice().compareTo(BigDecimal.ZERO) > 0)
                        ? detail.getSalePrice()
                        : detail.getPrice();
                if (effectivePrice != null) {
                    detail.setSubtotal(effectivePrice.multiply(BigDecimal.valueOf(detail.getQuantity())));
                }
            }
        }

        BigDecimal total = calculator.calcTotalAmount(order.getOrderDetails());
        if (total == null) {
            total = order.getOrderDetails().stream()
                    .map(detail -> detail.getSubtotal() != null ? detail.getSubtotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        order.setTotalAmount(total);

        List<Promotion> activePromotions = resolvePromotions(null);
        BigDecimal promotionOrderDiscount = calculator.calcPromotionOrderDiscount(total, activePromotions);
        if (promotionOrderDiscount == null) {
            promotionOrderDiscount = BigDecimal.ZERO;
        }
        BigDecimal discountAmount = promotionOrderDiscount;
        Coupon bestCoupon = null;

        if (order.getOrderType() == OrderType.POS || order.getOrderType() == OrderType.POS_SHIP) {
            List<Coupon> allCoupons = couponRepository.findAll();
            Long customerId = order.getCustomer() != null ? order.getCustomer().getCustomerId() : null;

            for (Coupon coupon : allCoupons) {
                if (!coupon.isValid()) {
                    continue;
                }

                if (coupon.getMinOrderValue() != null && total.compareTo(coupon.getMinOrderValue()) < 0) {
                    continue;
                }

                if (coupon.isPersonal()) {
                    continue;
                }

                if (customerId != null && coupon.getMaxUsesPerUser() != null) {
                    long used = orderRepository.countByUserIdAndCouponId(customerId, coupon.getCouponId());
                    if (used >= coupon.getMaxUsesPerUser()) {
                        continue;
                    }
                }

                BigDecimal discount = calculator.calcCouponDiscount(total.subtract(promotionOrderDiscount), coupon);
                if (discount == null) {
                    discount = BigDecimal.ZERO;
                }
                BigDecimal combinedDiscount = promotionOrderDiscount.add(discount);
                if (combinedDiscount.compareTo(discountAmount) > 0) {
                    discountAmount = combinedDiscount;
                    bestCoupon = coupon;
                }
            }

            if (bestCoupon != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
                order.setCoupon(bestCoupon);
                order.setCouponCode(bestCoupon.getCode());
            } else {
                order.setCoupon(null);
                order.setCouponCode(null);
            }
        } else {

            if (order.getCoupon() != null) {
                discountAmount = calculator.calcCouponDiscount(total, order.getCoupon());
                if (discountAmount == null) {
                    discountAmount = BigDecimal.ZERO;
                }
            }
        }

        order.setDiscountAmount(discountAmount);
        order.setShippingFee(BigDecimal.ZERO);
        order.setFinalAmount(total.subtract(discountAmount));
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, Long userId) {
        Order order = findWithDetails(orderId);
        checkOwnership(order, userId);
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode, Long userId) {
        Order order = orderRepository.findByOrderCodeWithDetails(orderCode)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy đơn: " + orderCode));
        checkOwnership(order, userId);
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse lookupGuestOrder(GuestOrderLookupRequest request) {
        String orderCode = request.getOrderCode().trim();
        String phone = request.getPhone().trim();
        Order order = orderRepository.findGuestOrderForLookup(orderCode, phone)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng phù hợp với thông tin đã nhập"));
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> getMyOrders(Long userId, OrderFilterRequest filter) {
        return orderRepository.findByUserId(userId, filter.getOrderStatus(), filter.getKeyword(), buildPageable(filter))
                .map(orderMapper::toSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse adminGetOrderById(Long orderId) {
        return orderMapper.toResponse(findWithDetails(orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> adminFilterOrders(OrderFilterRequest filter) {
        Pageable pageable = buildPageable(filter);
        String keyword = filter.getKeyword() == null || filter.getKeyword().isBlank()
                ? null
                : filter.getKeyword().trim();
        Page<Order> orders;
        if (filter.getDateBasis() == OrderDateBasis.COMPLETED) {
            orders = orderRepository.filterOrdersByCompletedDate(
                    keyword, filter.getOrderStatus(), filter.getOrderType(),
                    filter.getPaymentMethod(), filter.getUserId(), filter.getStaffId(),
                    filter.getFromDate(), filter.getToDate(), pageable
            );
        } else {
            orders = orderRepository.filterOrders(
                    keyword, filter.getOrderStatus(), filter.getOrderType(),
                    filter.getPaymentMethod(), filter.getUserId(), filter.getStaffId(),
                    filter.getFromDate(), filter.getToDate(), pageable
            );
        }
        return orders.map(orderMapper::toSummaryResponse);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrderByUser(Long orderId, Long userId, String reason) {
        Order order = findWithDetails(orderId);
        OrderStatus prev = order.getOrderStatus();
        checkOwnership(order, userId);

        if (!CUSTOMER_CANCELLABLE_STATUSES.contains(order.getOrderStatus())) {
            if (order.getOrderStatus() == OrderStatus.CONFIRMED) {
                throw new BadRequestException(
                        "Đơn hàng đã được xác nhận nên bạn không thể hủy. "
                                + "Vui lòng liên hệ cửa hàng nếu cần hỗ trợ."
                );
            }
            throw new BadRequestException(
                    "Bạn chỉ có thể hủy đơn khi đơn đang chờ xác nhận, "
                            + "chờ bổ sung hàng hoặc chờ thanh toán."
            );
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setNote(reason);

        releaseClaimedInventory(order);
        releaseReservedInventory(order.getOrderDetails(), order);

        if (order.getCoupon() != null)
            couponRepository.decrementUsedQuantity(order.getCoupon().getCouponId());

        Order saved = orderRepository.save(order);
        handleRefundIfPaid(saved, reason);
        saveTransactionLog(
                saved,
                prev,
                saved.getOrderStatus(),
                "Khách hàng hủy đơn",
                reason,
                saved.getCustomer() != null ? saved.getCustomer().getFullName() : "Khách hàng"
        );
        log.info("[ONLINE] Huỷ đơn {} bởi userId={}", saved.getOrderCode(), userId);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse cancelUnpaidPaymentOrder(Long orderId, String reason) {
        Order order = findWithDetails(orderId);
        return cancelUnpaidPaymentOrderInternal(order, reason);
    }

    @Override
    @Transactional
    public OrderResponse cancelUnpaidPaymentOrder(Long orderId, Long userId, String reason) {
        Order order = findWithDetails(orderId);
        checkOwnership(order, userId);
        return cancelUnpaidPaymentOrderInternal(order, reason);
    }

    @Override
    @Transactional
    public OrderResponse confirmPaidOnlineOrder(Long orderId) {
        Order order = findWithDetails(orderId);

        if (order.getOrderType() == OrderType.POS || order.getOrderType() == OrderType.POS_SHIP) {
            return orderMapper.toResponse(order);
        }

        if (order.getOrderStatus() == OrderStatus.CONFIRMED) {
            return orderMapper.toResponse(order);
        }

        if (order.getOrderStatus() != OrderStatus.WAITING_PAYMENT) {
            throw new IllegalStateException(
                    "Không thể xác nhận thanh toán cho đơn ở trạng thái: " + order.getOrderStatus());
        }

        order.setOrderStatus(OrderStatus.CONFIRMED);

        Order saved = orderRepository.save(order);
        saveTransactionLog(
                saved,
                OrderStatus.WAITING_PAYMENT,
                saved.getOrderStatus(),
                "Thanh toán trực tuyến thành công",
                "Thanh toán qua cổng trực tuyến thành công",
                "Hệ thống"
        );
        log.info("[PAYMENT] Xác nhận thanh toán, đơn chuyển sang ĐÃ XÁC NHẬN và trừ kho: {}", saved.getOrderCode());
        return orderMapper.toResponse(saved);
    }

    private OrderResponse cancelUnpaidPaymentOrderInternal(Order order, String reason) {
        OrderStatus prev = order.getOrderStatus();
        if (order.getOrderType() != OrderType.ONLINE
                || order.getOrderStatus() != OrderStatus.WAITING_PAYMENT) {
            return orderMapper.toResponse(order);
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setNote(reason);
        releaseClaimedInventory(order);
        releaseReservedInventory(order.getOrderDetails(), order);

        if (order.getCoupon() != null) {
            couponRepository.decrementUsedQuantity(order.getCoupon().getCouponId());
        }

        Order saved = orderRepository.save(order);
        saveTransactionLog(
                saved,
                prev,
                saved.getOrderStatus(),
                "Hủy đơn hàng chưa thanh toán",
                reason,
                "Hệ thống"
        );
        log.info("[PAYMENT] Huỷ đơn chưa thanh toán và giải phóng kho: {}", saved.getOrderCode());
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public com.base.dto.response.order.BulkUpdateOrderStatusResponse bulkUpdateOrderStatus(
            com.base.dto.request.order.BulkUpdateOrderStatusRequest request, Long staffId) {
        if (EVIDENCE_REQUIRED_STATUSES.contains(request.getOrderStatus())) {
            throw new BadRequestException(
                    "Không thể cập nhật hàng loạt sang trạng thái cần ảnh xác nhận. "
                            + "Vui lòng cập nhật riêng từng đơn hàng."
            );
        }
        List<Long> distinctOrderIds = request.getOrderIds().stream().distinct().toList();
        List<Order> selectedOrders = orderRepository.findAllById(distinctOrderIds);
        if (selectedOrders.size() != distinctOrderIds.size()) {
            throw new ResourceNotFoundException("Có đơn hàng trong danh sách không tồn tại");
        }
        Set<OrderStatus> selectedStatuses = selectedOrders.stream()
                .map(Order::getOrderStatus)
                .collect(Collectors.toSet());
        if (selectedStatuses.size() > 1) {
            throw new BadRequestException(
                    "Chỉ được cập nhật hàng loạt các đơn hàng đang có cùng trạng thái"
            );
        }
        int successCount = 0;
        int failedCount = 0;
        List<Long> updatedOrderIds = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();

        if (request.getOrderIds() != null) {
            for (Long orderId : distinctOrderIds) {
                try {
                    UpdateOrderStatusRequest statusReq = new UpdateOrderStatusRequest();
                    statusReq.setOrderStatus(request.getOrderStatus());
                    statusReq.setNote(request.getNote());

                    self.updateOrderStatusInNewTransaction(orderId, statusReq, staffId);
                    log.info("DELETE");
                    successCount++;
                    updatedOrderIds.add(orderId);
                } catch (Exception e) {
                    failedCount++;
                    errorMessages.add("Đơn hàng #" + orderId + ": " + e.getMessage());
                }
            }
        }

        return com.base.dto.response.order.BulkUpdateOrderStatusResponse.builder()
                .successCount(successCount)
                .failedCount(failedCount)
                .updatedOrderIds(updatedOrderIds)
                .errorMessages(errorMessages)
                .build();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateOrderStatusInNewTransaction(Long orderId, UpdateOrderStatusRequest request, Long staffId) {
        updateOrderStatus(orderId, request, staffId);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, Long staffId) {
        return updateOrderStatus(orderId, request, staffId, List.of());
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(
            Long orderId,
            UpdateOrderStatusRequest request,
            Long staffId,
            List<MultipartFile> images
    ) {
        Order order = findWithDetails(orderId);
        OrderStatus current = order.getOrderStatus();
        OrderStatus requestedNext = request.getOrderStatus();

        validateTransition(order, current, requestedNext);
        List<MultipartFile> evidenceImages = normalizeAndValidateEvidenceImages(
                requestedNext,
                images
        );

        User staff = userRepository.findById(staffId).orElse(null);
        if (request.getNote() != null) order.setNote(request.getNote());

        boolean claimedInventoryDuringTransition = false;
        List<CloudinaryService.UploadedImage> uploadedImages = new ArrayList<>();
        try {
            for (MultipartFile image : evidenceImages) {
                uploadedImages.add(cloudinaryService.uploadImageWithMetadata(image));
            }

            OrderStatus effectiveNext = requestedNext;
            try {
                handleInventoryOnStatusChange(order, current, requestedNext, staff, request);
                claimedInventoryDuringTransition = isOnlineInventoryConfirmation(
                        current, requestedNext);
            } catch (InsufficientStockException ex) {
                if (current == OrderStatus.PENDING
                        && requestedNext == OrderStatus.CONFIRMED
                        && order.getOrderType() == OrderType.ONLINE) {
                    effectiveNext = OrderStatus.WAITING_STOCK;
                    log.info("Đơn {} chuyển sang chờ bổ sung hàng: {}",
                            order.getOrderCode(), ex.getMessage());
                } else if (current == OrderStatus.WAITING_STOCK
                        && requestedNext == OrderStatus.CONFIRMED) {
                    throw new BadRequestException(
                            "Chưa thể xác nhận đã đủ hàng. " + ex.getMessage());
                } else {
                    throw ex;
                }
            }

            order.setStaff(staff);
            order.setOrderStatus(effectiveNext);
            if ((effectiveNext == OrderStatus.COMPLETED || effectiveNext == OrderStatus.CANCELED_BY_DAMAGED)
                    && current != OrderStatus.COMPLETED && current != OrderStatus.CANCELED_BY_DAMAGED) {
                order.setCompletedAt(LocalDateTime.now());
            }

            Order saved = orderRepository.save(order);
            if (effectiveNext == OrderStatus.CANCELLED) {
                handleRefundIfPaid(saved, request.getNote());
            }
            OrderTransactionLog transactionLog = saveTransactionLog(
                    saved,
                    current,
                    saved.getOrderStatus(),
                    getStatusActionName(effectiveNext),
                    request.getNote(),
                    staff != null ? staff.getFullName() : "Nhân viên"
            );
            saveEvidenceImages(transactionLog, evidenceImages, uploadedImages);

            sendShippingUpdateEmail(saved, effectiveNext);

            log.info("Cập nhật đơn {} : {} → {} | staffId={}",
                    saved.getOrderCode(), current, effectiveNext, staffId);
            return orderMapper.toResponse(saved);
        } catch (RuntimeException ex) {
            if (claimedInventoryDuringTransition) {
                releaseClaimedInventory(order);
            }
            uploadedImages.forEach(image -> cloudinaryService.deleteByPublicId(image.publicId()));
            throw ex;
        }
    }

    private void confirmInventory(List<OrderDetail> details, Order order, User staff) {
        for (OrderDetail d : details) {
            ProductVariant v = d.getVariant();
            if (v == null) continue;
            v.setStockQuantity(Math.max(0, v.getStockQuantity() - d.getQuantity()));
            variantRepository.save(v);
        }
        reservationRepository.findByOrder_OrderIdAndStatus(
                        order.getOrderId(), Reservation.ReservationStatus.ACTIVE)
                .forEach(r -> r.setStatus(Reservation.ReservationStatus.COMPLETED));
    }

    private void deductInventoryDirect(List<OrderDetail> details, Order order, User staff) {
        for (OrderDetail d : details) {
            ProductVariant v = d.getVariant();
            if (v == null) continue;
            if (v.getAvailableStock() < d.getQuantity()) {
                throw new BadRequestException(String.format(
                        "Sản phẩm '%s' (%s - %s) không đủ hàng. Cần: %d, còn: %d",
                        v.getProduct().getProductName(), v.getSize(), v.getColor(),
                        d.getQuantity(), v.getAvailableStock()));
            }
            v.setStockQuantity(Math.max(0, v.getStockQuantity() - d.getQuantity()));
            variantRepository.save(v);
        }
    }

    private void releaseReservedInventory(List<OrderDetail> details, Order order) {

        reservationRepository.findByOrder_OrderIdAndStatus(
                        order.getOrderId(), Reservation.ReservationStatus.ACTIVE)
                .forEach(r -> r.setStatus(Reservation.ReservationStatus.RELEASED));
    }

    private void restoreInventory(List<OrderDetail> details, Order order, User staff) {
        for (OrderDetail d : details) {
            ProductVariant v = d.getVariant();
            if (v == null) continue;
            v.setStockQuantity(v.getStockQuantity() + d.getQuantity());
            variantRepository.save(v);
        }
    }

    private void handleInventoryOnStatusChange(Order order, OrderStatus current,
                                               OrderStatus next, User staff,
                                               UpdateOrderStatusRequest request) {
        List<OrderDetail> details = order.getOrderDetails();

        if ((current == OrderStatus.PENDING || current == OrderStatus.WAITING_STOCK)
                && next == OrderStatus.CONFIRMED) {

            claimInventoryInstantly(details, order.getOrderCode());
            reservationRepository.findByOrder_OrderIdAndStatus(
                            order.getOrderId(), Reservation.ReservationStatus.ACTIVE)
                    .forEach(reservation -> reservation.setStatus(
                            Reservation.ReservationStatus.COMPLETED));

        } else if ((current == OrderStatus.PENDING || current == OrderStatus.WAITING_STOCK)
                && (next == OrderStatus.CANCELLED || next == OrderStatus.REFUNDED)) {

            releaseClaimedInventory(order);
            releaseReservedInventory(details, order);
            if (order.getCoupon() != null)
                couponRepository.decrementUsedQuantity(order.getCoupon().getCouponId());

        } else if ((current == OrderStatus.WAITING_PAYMENT || current == OrderStatus.DRAFT)
                && (next == OrderStatus.CANCELLED || next == OrderStatus.REFUNDED)) {

            releaseClaimedInventory(order);
            releaseReservedInventory(details, order);
            if (order.getCoupon() != null)
                couponRepository.decrementUsedQuantity(order.getCoupon().getCouponId());

        } else if (current == OrderStatus.RETURNED_TO_SHOP && next == OrderStatus.REFUNDED) {

            if (order.getCoupon() != null)
                couponRepository.decrementUsedQuantity(order.getCoupon().getCouponId());

        } else if (next == OrderStatus.CANCELED_BY_DAMAGED) {

            releaseClaimedInventoryForDamagedOrder(order, request.getDamagedItems());

            if (order.getCoupon() != null)
                couponRepository.decrementUsedQuantity(order.getCoupon().getCouponId());

        } else if (next == OrderStatus.RETURNED_TO_SHOP) {

            releaseClaimedInventory(order);
        } else if (next == OrderStatus.CANCELLED) {

            releaseClaimedInventory(order);
            releaseReservedInventory(details, order);
            if (order.getCoupon() != null)
                couponRepository.decrementUsedQuantity(order.getCoupon().getCouponId());
        }
    }

    private void restoreUndamagedInventory(
            List<OrderDetail> details,
            List<UpdateOrderStatusRequest.DamagedItemRequest> damagedItems) {

        Map<Long, Integer> damagedMap = new HashMap<>();
        for (UpdateOrderStatusRequest.DamagedItemRequest di : damagedItems) {
            damagedMap.put(di.getVariantId(), di.getDamagedQuantity());
        }

        for (OrderDetail d : details) {
            ProductVariant v = d.getVariant();
            if (v == null) continue;

            int damagedQty = damagedMap.getOrDefault(v.getVariantId(), d.getQuantity());

            damagedQty = Math.max(0, Math.min(damagedQty, d.getQuantity()));
            int undamagedQty = d.getQuantity() - damagedQty;

            if (undamagedQty > 0) {
                v.setStockQuantity(v.getStockQuantity() + undamagedQty);
                variantRepository.save(v);
                log.info("[DAMAGED] variant={} → hoàn kho {} (đặt={}, hỏng={})",
                        v.getVariantId(), undamagedQty, d.getQuantity(), damagedQty);
            } else {
                log.info("[DAMAGED] variant={} → toàn bộ {} hỏng, không hoàn kho",
                        v.getVariantId(), d.getQuantity());
            }
        }
    }

    private void sendOrderConfirmationEmail(Order order) {
        String email    = resolveRecipientEmail(order);
        String name     = resolveRecipientName(order);
        if (email == null) return;

        OrderAddress address = order.getOrderAddress();

        try {
            emailProducer.sendAfterCommit(EmailMessage.builder()
                    .to(email)
                    .recipientName(name)
                    .type(EmailType.ORDER_CONFIRMATION)
                    .data(Map.of(
                            "orderId",      order.getOrderId(),
                            "orderCode",    order.getOrderCode(),
                            "finalAmount",  order.getFinalAmount(),
                            "receiverName", address != null && address.getReceiverName() != null
                                    ? address.getReceiverName() : "-",
                            "receiverPhone", address != null && address.getReceiverPhone() != null
                                    ? address.getReceiverPhone() : "-",
                            "receiverAddress", formatReceiverAddress(address)
                    ))
                    .build());
        } catch (Exception e) {
            log.warn("[EMAIL] Gửi xác nhận đơn {} thất bại: {}", order.getOrderCode(), e.getMessage());
        }
    }

    private void sendShippingUpdateEmail(Order order, OrderStatus newStatus) {

        if (order.getOrderType() == OrderType.POS) return;

        boolean shouldNotify = switch (newStatus.name()) {
            case "CONFIRMED", "SHIPPING", "COMPLETED",
                 "CANCELLED", "REFUNDED", "RETURNING", "RETURNED_TO_SHOP",
                 "FAILED_DELIVERY", "CANCELED_BY_DAMAGED" -> true;
            default -> false;
        };
        if (!shouldNotify) return;

        String email = resolveRecipientEmail(order);
        String name  = resolveRecipientName(order);
        if (email == null) return;

        try {
            emailProducer.send(EmailMessage.builder()
                    .to(email)
                    .recipientName(name)
                    .type(EmailType.SHIPPING_UPDATE)
                    .data(Map.of(
                            "orderId",   order.getOrderId(),
                            "orderCode", order.getOrderCode(),
                            "status",    newStatus.name(),
                            "statusVi",  getStatusVietnamese(newStatus)
                    ))
                    .build());
        } catch (Exception e) {
            log.warn("[EMAIL] Gửi cập nhật trạng thái đơn {} thất bại: {}", order.getOrderCode(), e.getMessage());
        }
    }

    private String resolveRecipientEmail(Order order) {
        if (order.getCustomer() != null && order.getCustomer().getEmail() != null) {
            return order.getCustomer().getEmail();
        }
        return trimToNull(order.getGuestEmail());
    }

    private String resolveRecipientName(Order order) {
        if (order.getCustomer() != null && order.getCustomer().getFullName() != null) {
            return order.getCustomer().getFullName();
        }
        if (order.getGuestName() != null && !order.getGuestName().isBlank()) {
            return order.getGuestName();
        }
        if (order.getOrderAddress() != null && order.getOrderAddress().getReceiverName() != null) {
            return order.getOrderAddress().getReceiverName();
        }
        return "Khách hàng";
    }

    private String formatReceiverAddress(OrderAddress address) {
        if (address == null) return "-";
        String value = Stream.of(
                        address.getDetailAddress(),
                        address.getWard(),
                        address.getProvince()
                )
                .map(this::trimToNull)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
        return value.isBlank() ? "-" : value;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String getStatusVietnamese(OrderStatus status) {
        return switch (status.name()) {
            case "CONFIRMED"           -> "Đã xác nhận";
            case "SHIPPING"            -> "Đang giao hàng";
            case "COMPLETED"           -> "Đã hoàn thành";
            case "CANCELLED"           -> "Đã hủy";
            case "REFUNDED"            -> "Đã hoàn tiền / đổi hàng";
            case "RETURNING"           -> "Đang hoàn hàng về shop";
            case "RETURNED_TO_SHOP"    -> "Shop đã nhận hàng hoàn";
            case "FAILED_DELIVERY"     -> "Giao hàng thất bại";
            case "CANCELED_BY_DAMAGED" -> "Hủy do hàng bị hỏng";
            case "WAITING_PAYMENT"     -> "Chờ thanh toán";
            case "PENDING"             -> "Chờ xác nhận";
            case "WAITING_STOCK"       -> "Chờ bổ sung hàng";
            case "DRAFT"               -> "Đơn nháp";
            default -> status.name();
        };
    }

    private List<OrderDetail> buildOrderDetails(
            List<OrderDetailRequest> items,
            OrderType type,
            List<Promotion> activePromotions
    ) {
        List<OrderDetail> details = new ArrayList<>();
        List<PriceChangeResponse> priceChanges = new ArrayList<>();

        for (OrderDetailRequest item : items) {

            ProductVariant variant = variantRepository.findByIdWithAll(item.getVariantId())
                    .orElseThrow(() -> new BadRequestException(
                            "Sản phẩm không tồn tại: variantId=" + item.getVariantId()));

            if (variant.getStatus() == com.base.enums.ProductVariantStatus.INACTIVE ||
                    variant.getProduct().getStatus() == com.base.enums.ProductStatus.INACTIVE) {
                throw new BadRequestException(String.format(
                        "Sản phẩm '%s' (%s - %s) hiện đã ngừng kinh doanh, vui lòng loại bỏ khỏi giỏ hàng!",
                        variant.getProduct().getProductName(),
                        variant.getSize(), variant.getColor()
                ));
            }

            if (type != OrderType.ONLINE
                    && (item.getPrice() == null || variant.getPrice() == null
                    || variant.getPrice().compareTo(item.getPrice()) != 0)) {
                throw new BadRequestException(String.format(
                        "Sản phẩm '%s' (%s - %s) có sự thay đổi về giá vui lòng cập nhật lại!",
                        variant.getProduct().getProductName(),
                        variant.getSize(), variant.getColor()
                ));
            }

            int available = variant.getAvailableStock();

            if (available < item.getQuantity()) {
                throw new BadRequestException(String.format(
                        "Sản phẩm '%s' (%s - %s) không đủ hàng. Yêu cầu: %d, còn: %d",
                        variant.getProduct().getProductName(),
                        variant.getSize(), variant.getColor(),
                        item.getQuantity(), available));
            }

            Long categoryId = variant.getProduct().getCategory() != null
                    ? variant.getProduct().getCategory().getCategoryId()
                    : null;

            BigDecimal finalUnitPrice = calculator.applyPromotionToUnit(
                    variant.getPrice(),
                    variant.getVariantId(),
                    variant.getProduct().getProductId(),
                    categoryId,
                    activePromotions
            );

            if (type == OrderType.ONLINE
                    && (item.getPrice() == null || finalUnitPrice.compareTo(item.getPrice()) != 0)) {
                priceChanges.add(PriceChangeResponse.builder()
                        .variantId(variant.getVariantId())
                        .productName(variant.getProduct().getProductName())
                        .size(variant.getSize())
                        .color(variant.getColor())
                        .checkoutPrice(item.getPrice())
                        .currentPrice(finalUnitPrice)
                        .originalPrice(variant.getPrice())
                        .build());
            }

            BigDecimal subtotal = finalUnitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

            String imageUrl = null;
            if (variant.getImage() != null) {
                imageUrl = variant.getImage().getImageUrl();
            } else if (variant.getProduct() != null &&
                    variant.getProduct().getImages() != null &&
                    !variant.getProduct().getImages().isEmpty()) {
                imageUrl = variant.getProduct().getImages().get(0).getImageUrl();
            }

            BigDecimal originalPrice = variant.getPrice();
            BigDecimal salePrice = (finalUnitPrice != null && finalUnitPrice.compareTo(originalPrice) < 0) ? finalUnitPrice : null;

            details.add(OrderDetail.builder()
                    .variant(variant)
                    .productName(variant.getProduct().getProductName())
                    .imageUrl(imageUrl)
                    .size(variant.getSize())
                    .color(variant.getColor())
                    .quantity(item.getQuantity())
                    .price(originalPrice)
                    .salePrice(salePrice)
                    .subtotal(subtotal)
                    .build());
        }

        if (!priceChanges.isEmpty()) {
            throw new PriceChangedException(priceChanges);
        }

        return details;
    }

    private Customer resolveCustomer(Long userId) {
        return customerRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Khách hàng không tồn tại: " + userId));
    }

    private User resolveUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Khách hàng không tồn tại: " + userId));
    }

    private void reserveCouponUsage(Coupon coupon) {
        if (coupon == null) return;

        int updatedRows = couponRepository.incrementUsedQuantity(coupon.getCouponId());
        if (updatedRows == 0) {
            throw new BadRequestException("Phiếu giảm giá đã hết lượt sử dụng");
        }
    }

    private Coupon resolveCoupon(Long couponId, Long customerId) {
        if (couponId == null) return null;
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BadRequestException("Phiếu giảm giá không tồn tại"));
        if (!coupon.isValid())
            throw new BadRequestException("Phiếu giảm giá đã hết hạn hoặc không còn lượt dùng");

        if (coupon.isPersonal()) {
            if (customerId == null
                    || !couponRepository.isCustomerEligible(couponId, customerId)) {
                throw new BadRequestException("Mã giảm giá này không áp dụng cho khách hàng này");
            }
        }
        if (customerId != null && coupon.getMaxUsesPerUser() != null) {
            long used = orderRepository.countByUserIdAndCouponId(customerId, couponId);
            if (used >= coupon.getMaxUsesPerUser())
                throw new BadRequestException(
                        "Bạn đã sử dụng đủ " + Math.min(used, coupon.getMaxUsesPerUser())
                                + "/" + coupon.getMaxUsesPerUser()
                                + " lượt cho mã giảm giá " + coupon.getCode()
                );
        }
        return coupon;
    }

    private List<Promotion> resolvePromotions(Long promotionId) {
        if (promotionId == null) {
            return new ArrayList<>(promotionRepository.findActivePromotions(LocalDateTime.now()));
        }

        Promotion selected = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new BadRequestException("Đợt giảm giá không tồn tại"));

        if (!selected.isActive()) {
            throw new BadRequestException("Đợt giảm giá đã hết hạn hoặc chưa được kích hoạt");
        }

        return List.of(selected);
    }

    private void checkOwnership(Order order, Long userId) {
        if (userId == null) return;
        if (order.getCustomer() == null || !order.getCustomer().getCustomerId().equals(userId))
            throw new AccessDeniedException("Bạn không có quyền truy cập đơn hàng này");
    }

    private void validateTransition(Order order, OrderStatus current, OrderStatus next) {
        Map<OrderStatus, Set<OrderStatus>> transitions =
                order.getOrderType() == OrderType.POS
                        ? allowedPosTransitions()
                        : allowedDeliveryTransitions();

        if (!transitions.getOrDefault(current, Set.of()).contains(next)) {
            throw new BadRequestException(
                    "Không thể chuyển đơn " + order.getOrderType()
                            + " từ " + current + " sang " + next);
        }

        if (next == OrderStatus.WAITING_STOCK && !requiresStockReplenishment(order)) {
            throw new BadRequestException(
                    "Đơn hàng vẫn đủ tồn kho, không thể chuyển sang trạng thái chờ bổ sung hàng");
        }
    }

    private boolean isOnlineInventoryConfirmation(OrderStatus current, OrderStatus next) {
        return (current == OrderStatus.PENDING || current == OrderStatus.WAITING_STOCK)
                && next == OrderStatus.CONFIRMED;
    }

    private boolean requiresStockReplenishment(Order order) {
        if (order.getOrderDetails() == null || order.getOrderDetails().isEmpty()) {
            return false;
        }

        Map<Long, Integer> requestedByVariant = order.getOrderDetails().stream()
                .filter(detail -> detail.getVariant() != null
                        && detail.getVariant().getVariantId() != null
                        && detail.getQuantity() != null
                        && detail.getQuantity() > 0)
                .collect(Collectors.toMap(
                        detail -> detail.getVariant().getVariantId(),
                        OrderDetail::getQuantity,
                        Integer::sum));

        return requestedByVariant.entrySet().stream().anyMatch(request -> {
            ProductVariant variant = order.getOrderDetails().stream()
                    .map(OrderDetail::getVariant)
                    .filter(Objects::nonNull)
                    .filter(item -> request.getKey().equals(item.getVariantId()))
                    .findFirst()
                    .orElse(null);
            int stockQuantity = variant != null && variant.getStockQuantity() != null
                    ? variant.getStockQuantity() : 0;
            return stockQuantity < request.getValue();
        });
    }

    private Map<OrderStatus, Set<OrderStatus>> allowedPosTransitions() {
        Map<OrderStatus, Set<OrderStatus>> map = new EnumMap<>(OrderStatus.class);
        map.put(OrderStatus.DRAFT, Set.of(OrderStatus.WAITING_PAYMENT, OrderStatus.CANCELLED));
        map.put(OrderStatus.WAITING_PAYMENT, Set.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED));

        map.put(OrderStatus.COMPLETED, Set.of());
        return map;
    }

    private Map<OrderStatus, Set<OrderStatus>> allowedDeliveryTransitions() {
        Map<OrderStatus, Set<OrderStatus>> map = new EnumMap<>(OrderStatus.class);
        map.put(OrderStatus.PENDING, Set.of(
                OrderStatus.CONFIRMED, OrderStatus.WAITING_STOCK, OrderStatus.CANCELLED));
        map.put(OrderStatus.WAITING_STOCK, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED));
        map.put(OrderStatus.WAITING_PAYMENT, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED));
        map.put(OrderStatus.CONFIRMED, Set.of(OrderStatus.SHIPPING, OrderStatus.CANCELLED));
        map.put(OrderStatus.SHIPPING, Set.of(
                OrderStatus.COMPLETED,
                OrderStatus.FAILED_DELIVERY,
                OrderStatus.RETURNING,
                OrderStatus.CANCELED_BY_DAMAGED
        ));
        map.put(OrderStatus.FAILED_DELIVERY, Set.of(
                OrderStatus.SHIPPING,
                OrderStatus.RETURNING,
                OrderStatus.CANCELED_BY_DAMAGED
        ));
        map.put(OrderStatus.RETURNING, Set.of(
                OrderStatus.RETURNED_TO_SHOP,
                OrderStatus.CANCELED_BY_DAMAGED
        ));
        map.put(OrderStatus.RETURNED_TO_SHOP, Set.of(OrderStatus.REFUNDED));
        map.put(OrderStatus.CANCELED_BY_DAMAGED, Set.of());

        map.put(OrderStatus.COMPLETED, Set.of());
        return map;
    }

    private Order findWithDetails(Long orderId) {
        return orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy đơn hàng: " + orderId));
    }

    private Pageable buildPageable(OrderFilterRequest f) {
        Sort sort = f.getSortDir().equalsIgnoreCase("asc")
                ? Sort.by(f.getSortBy()).ascending()
                : Sort.by(f.getSortBy()).descending();
        return PageRequest.of(f.getPage(), f.getSize(), sort);
    }

    private OrderTransactionLog saveTransactionLog(Order order, OrderStatus previousStatus, OrderStatus currentStatus, String action, String note, String createdBy) {
        OrderTransactionLog logEntry = OrderTransactionLog.builder()
                .order(order)
                .previousStatus(previousStatus)
                .currentStatus(currentStatus)
                .action(action)
                .note(note)
                .createdBy(createdBy)
                .build();
        OrderTransactionLog savedLog = orderTransactionLogRepository.save(logEntry);
        if (order.getTransactionLogs() == null) {
            order.setTransactionLogs(new ArrayList<>());
        }
        order.getTransactionLogs().add(savedLog);
        return savedLog;
    }

    private List<MultipartFile> normalizeAndValidateEvidenceImages(
            OrderStatus requestedStatus,
            List<MultipartFile> images
    ) {
        List<MultipartFile> normalized = images == null
                ? List.of()
                : images.stream().filter(Objects::nonNull).filter(file -> !file.isEmpty()).toList();

        if (EVIDENCE_REQUIRED_STATUSES.contains(requestedStatus) && normalized.isEmpty()) {
            throw new BadRequestException(
                    "Trạng thái " + requestedStatus + " bắt buộc phải có ít nhất một ảnh xác nhận"
            );
        }
        if (normalized.size() > MAX_EVIDENCE_IMAGES) {
            throw new BadRequestException("Chỉ được tải lên tối đa 5 ảnh xác nhận");
        }

        for (MultipartFile file : normalized) {
            if (file.getSize() > MAX_EVIDENCE_IMAGE_SIZE) {
                throw new BadRequestException("Mỗi ảnh xác nhận không được vượt quá 5 MB");
            }
            String contentType = file.getContentType() == null
                    ? ""
                    : file.getContentType().toLowerCase(Locale.ROOT);
            if (!ALLOWED_EVIDENCE_CONTENT_TYPES.contains(contentType)
                    || !hasSupportedImageSignature(file)) {
                throw new BadRequestException(
                        "Ảnh xác nhận chỉ hỗ trợ định dạng JPEG, PNG hoặc WebP"
                );
            }
        }
        return normalized;
    }

    private boolean hasSupportedImageSignature(MultipartFile file) {
        try {
            byte[] header = file.getInputStream().readNBytes(12);
            boolean jpeg = header.length >= 3
                    && (header[0] & 0xFF) == 0xFF
                    && (header[1] & 0xFF) == 0xD8
                    && (header[2] & 0xFF) == 0xFF;
            boolean png = header.length >= 8
                    && (header[0] & 0xFF) == 0x89
                    && header[1] == 0x50
                    && header[2] == 0x4E
                    && header[3] == 0x47
                    && header[4] == 0x0D
                    && header[5] == 0x0A
                    && header[6] == 0x1A
                    && header[7] == 0x0A;
            boolean webp = header.length >= 12
                    && header[0] == 'R'
                    && header[1] == 'I'
                    && header[2] == 'F'
                    && header[3] == 'F'
                    && header[8] == 'W'
                    && header[9] == 'E'
                    && header[10] == 'B'
                    && header[11] == 'P';
            return jpeg || png || webp;
        } catch (IOException e) {
            return false;
        }
    }

    private void saveEvidenceImages(
            OrderTransactionLog transactionLog,
            List<MultipartFile> files,
            List<CloudinaryService.UploadedImage> uploads
    ) {
        if (files.isEmpty()) return;

        List<OrderTransactionLogImage> imageEntities = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            CloudinaryService.UploadedImage upload = uploads.get(i);
            imageEntities.add(OrderTransactionLogImage.builder()
                    .transactionLog(transactionLog)
                    .imageUrl(upload.url())
                    .cloudPublicId(upload.publicId())
                    .originalName(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .build());
        }
        List<OrderTransactionLogImage> savedImages =
                orderTransactionLogImageRepository.saveAll(imageEntities);
        transactionLog.getImages().addAll(savedImages);
    }

    private String getStatusActionName(OrderStatus status) {
        if (status == null) return "Cập nhật đơn hàng";
        return switch (status.name()) {
            case "CONFIRMED" -> "Xác nhận đơn hàng";
            case "SHIPPING" -> "Đang giao hàng";
            case "FAILED_DELIVERY" -> "Giao hàng thất bại";
            case "COMPLETED" -> "Hoàn thành đơn hàng";
            case "CANCELLED" -> "Hủy đơn hàng";
            case "REFUNDED" -> "Hoàn tiền";
            case "DRAFT" -> "Tạo đơn chờ tại quầy";
            case "WAITING_PAYMENT" -> "Chờ thanh toán";
            case "PENDING" -> "Chờ xác nhận";
            case "WAITING_STOCK" -> "Chờ bổ sung hàng";
            case "RETURNING" -> "Đang chuyển hoàn";
            case "RETURNED_TO_SHOP" -> "Đã nhận lại hàng hoàn";
            case "CANCELED_BY_DAMAGED" -> "Hủy đơn do hỏng hàng";
            default -> "Cập nhật trạng thái thành " + status;
        };
    }

    private void handleRefundIfPaid(Order order, String reason) {
        if (order.getPaymentMethod() == PaymentMethod.VNPAY) {
            paymentRepository.findByOrder_OrderId(order.getOrderId()).ifPresent(payment -> {
                if (payment.getPaymentStatus() == PaymentStatus.PAID) {
                    try {
                        boolean success = paymentService.refundPayment(
                                order.getOrderId(),
                                payment.getAmount(),
                                "127.0.0.1",
                                "System_Cancel"
                        );
                        if (success) {
                            order.setOrderStatus(OrderStatus.REFUNDED);
                            order.setNote((order.getNote() != null ? order.getNote() : "") 
                                    + "\n[Tự động hoàn tiền VNPay thành công: " + payment.getAmount() + "đ]");
                            orderRepository.save(order);
                            log.info("Auto refund VNPay success for cancelled order: {}", order.getOrderCode());
                        } else {
                            order.setNote((order.getNote() != null ? order.getNote() : "") 
                                    + "\n[Tự động hoàn tiền VNPay thất bại, vui lòng kiểm tra portal VNPay]");
                            orderRepository.save(order);
                            log.warn("Auto refund VNPay failed for cancelled order: {}", order.getOrderCode());
                        }
                    } catch (Exception e) {
                        log.error("Lỗi tự động hoàn tiền VNPay cho đơn huỷ: {}", order.getOrderCode(), e);
                        order.setNote((order.getNote() != null ? order.getNote() : "") 
                                + "\n[Lỗi tự động hoàn tiền VNPay: " + e.getMessage() + "]");
                        orderRepository.save(order);
                    }
                }
            });
        }
    }
}
