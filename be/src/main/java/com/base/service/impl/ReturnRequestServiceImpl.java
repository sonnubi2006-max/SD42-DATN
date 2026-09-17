package com.base.service.impl;

import com.base.dto.request.returnRequest.CreateReturnItemRequest;
import com.base.dto.request.returnRequest.CreateReturnRequest;
import com.base.dto.request.returnRequest.RejectReturnRequest;
import com.base.dto.response.returnRequest.*;
import com.base.dto.request.returnRequest.CreateExchangeItemRequest;
import com.base.entity.*;
import com.base.enums.InventoryTransactionType;
import com.base.enums.OrderStatus;
import com.base.enums.PaymentMethod;
import com.base.enums.ReturnStatus;
import com.base.enums.ReturnType;
import java.time.LocalDateTime;
import java.time.LocalDate;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.repository.*;
import com.base.service.ReturnRequestService;
import com.base.service.helper.ReturnPolicy;
import com.base.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReturnRequestServiceImpl implements ReturnRequestService {

    private final ReturnRequestRepository returnRepository;
    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final CouponRepository couponRepository;
    private final PromotionRepository promotionRepository;
    private final OrderTransactionLogRepository orderTransactionLogRepository;
    private final ReturnPolicy returnPolicy;
    private final ExchangeDeliveryRepository exchangeDeliveryRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ReturnResponse> search(
            ReturnStatus status,
            String keyword,
            java.time.LocalDateTime fromDate,
            java.time.LocalDateTime toDate,
            Pageable pageable
    ) {
        return returnRepository.search(status, keyword, fromDate, toDate, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnStatisticsResponse getStatistics(
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {
        List<ReturnRequest> completedReturns =
                returnRepository.findCompletedForStatistics(fromDate, toDate);

        long returnedOrderCount = completedReturns.stream()
                .map(ReturnRequest::getOrder)
                .filter(java.util.Objects::nonNull)
                .map(Order::getOrderId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();

        BigDecimal totalRefundAmount = BigDecimal.ZERO;
        BigDecimal posRefundAmount = BigDecimal.ZERO;
        BigDecimal onlineRefundAmount = BigDecimal.ZERO;
        BigDecimal cashRefundAmount = BigDecimal.ZERO;
        BigDecimal transferRefundAmount = BigDecimal.ZERO;
        Map<LocalDate, BigDecimal> dailyRefundAmounts = new TreeMap<>();
        Map<LocalDate, BigDecimal> dailyCashRefundAmounts = new TreeMap<>();
        Map<LocalDate, BigDecimal> dailyTransferRefundAmounts = new TreeMap<>();

        for (ReturnRequest completedReturn : completedReturns) {
            if (completedReturn.getReturnType() != ReturnType.REFUND) {
                continue;
            }

            BigDecimal refundAmount = completedReturn.getRefundAmount() != null
                    ? completedReturn.getRefundAmount()
                    : BigDecimal.ZERO;
            totalRefundAmount = totalRefundAmount.add(refundAmount);

            Order order = completedReturn.getOrder();
            if (order != null
                    && (order.getOrderType() == com.base.enums.OrderType.POS
                    || order.getOrderType() == com.base.enums.OrderType.POS_SHIP)) {
                posRefundAmount = posRefundAmount.add(refundAmount);
            } else {
                onlineRefundAmount = onlineRefundAmount.add(refundAmount);
            }

            boolean isCashPayment = order != null
                    && (order.getPaymentMethod() == PaymentMethod.CASH
                    || order.getPaymentMethod() == PaymentMethod.COD);
            if (isCashPayment) {
                cashRefundAmount = cashRefundAmount.add(refundAmount);
            } else {
                transferRefundAmount = transferRefundAmount.add(refundAmount);
            }

            LocalDateTime completedAt = completedReturn.getUpdatedAt() != null
                    ? completedReturn.getUpdatedAt()
                    : completedReturn.getCreatedAt();
            if (completedAt != null) {
                dailyRefundAmounts.merge(
                        completedAt.toLocalDate(),
                        refundAmount,
                        BigDecimal::add
                );
                Map<LocalDate, BigDecimal> paymentRefunds = isCashPayment
                        ? dailyCashRefundAmounts
                        : dailyTransferRefundAmounts;
                paymentRefunds.merge(completedAt.toLocalDate(), refundAmount, BigDecimal::add);
            }
        }

        List<ReturnStatisticsResponse.DailyRefundResponse> dailyRefunds =
                dailyRefundAmounts.entrySet().stream()
                        .map(entry -> ReturnStatisticsResponse.DailyRefundResponse.builder()
                                .date(entry.getKey().toString())
                                .refundAmount(entry.getValue())
                                .cashRefundAmount(dailyCashRefundAmounts.getOrDefault(
                                        entry.getKey(), BigDecimal.ZERO))
                                .transferRefundAmount(dailyTransferRefundAmounts.getOrDefault(
                                        entry.getKey(), BigDecimal.ZERO))
                                .build())
                        .toList();

        return ReturnStatisticsResponse.builder()
                .returnedOrderCount(returnedOrderCount)
                .completedReturnCount(completedReturns.size())
                .totalRefundAmount(totalRefundAmount)
                .posRefundAmount(posRefundAmount)
                .onlineRefundAmount(onlineRefundAmount)
                .cashRefundAmount(cashRefundAmount)
                .transferRefundAmount(transferRefundAmount)
                .dailyRefunds(dailyRefunds)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnResponse getById(Long id) {
        return toResponse(findByIdWithItems(id));
    }

    @Override
    public ReturnResponse create(CreateReturnRequest request) {
        Order order = orderRepository.findByIdWithDetailsForUpdate(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        if (order.getOrderStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Chỉ tạo đổi hàng cho đơn đã hoàn tất");
        }
        returnPolicy.validateReturnWindow(order);

        User currentUser = getCurrentUserOrNull();
        Long currentPrincipalId = getCurrentPrincipalIdOrNull();
        boolean currentPrincipalStaff = isCurrentPrincipalStaff();

        if (!currentPrincipalStaff && (currentPrincipalId == null
                || order.getCustomer() == null
                || !order.getCustomer().getCustomerId().equals(currentPrincipalId))) {
            throw new BadRequestException("Bạn không có quyền tạo yêu cầu đổi hàng cho đơn này");
        }

        Map<Long, OrderDetail> orderDetailsByVariant = order.getOrderDetails()
                .stream()
                .filter(d -> d.getVariant() != null)
                .collect(Collectors.toMap(
                        d -> d.getVariant().getVariantId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));

        ReturnType type = request.getReturnType() != null ? request.getReturnType() : ReturnType.EXCHANGE;
        if (type != ReturnType.EXCHANGE) {
            throw new BadRequestException("Hệ thống hiện chỉ hỗ trợ đổi sản phẩm lỗi, không hỗ trợ đổi hàng hoàn tiền");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Danh sách sản phẩm trả không được để trống");
        }
        long distinctReturnVariants = request.getItems().stream()
                .map(CreateReturnItemRequest::getVariantId)
                .distinct()
                .count();
        if (distinctReturnVariants != request.getItems().size()) {
            throw new BadRequestException("Không được khai báo trùng biến thể trong cùng yêu cầu đổi hàng");
        }
        if (type == ReturnType.EXCHANGE
                && (request.getExchangeItems() == null || request.getExchangeItems().isEmpty())) {
            throw new BadRequestException("Yêu cầu đổi hàng phải có sản phẩm đổi mới");
        }
        if (type == ReturnType.REFUND
                && request.getExchangeItems() != null && !request.getExchangeItems().isEmpty()) {
            throw new BadRequestException("Yêu cầu hoàn tiền không được chứa sản phẩm đổi mới");
        }

        ReturnRequest returnRequest = ReturnRequest.builder()
                .order(order)
                .customer(order.getCustomer())
                .orderCode(order.getOrderCode())
                .customerName(resolveCustomerName(request, order))
                .customerPhone(resolveCustomerPhone(request, order))
                .refundAmount(BigDecimal.ZERO)
                .note(request.getNote())
                .images(request.getImages())
                .status(ReturnStatus.PENDING)
                .returnType(type)
                .exchangeFulfillmentMethod(!currentPrincipalStaff
                        ? com.base.enums.ExchangeFulfillmentMethod.DELIVERY
                        : (request.getExchangeFulfillmentMethod() != null
                                ? request.getExchangeFulfillmentMethod()
                                : com.base.enums.ExchangeFulfillmentMethod.STORE_PICKUP))
                .createdBy(currentUser)
                .build();

        if (type == ReturnType.EXCHANGE) {
            applyExchangeFulfillment(returnRequest, request);
        }

        List<ReturnItem> items = request.getItems().stream()
                .map(item -> buildReturnItem(item, order, orderDetailsByVariant, returnRequest))
                .toList();

        BigDecimal calculatedRefund = items.stream()
                .map(ReturnItem::getRefundPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (type == ReturnType.REFUND) {
            BigDecimal alreadyAllocated = returnRepository.sumAllocatedRefundAmount(order.getOrderId());
            if (alreadyAllocated == null) {
                alreadyAllocated = BigDecimal.ZERO;
            }
            BigDecimal remainingRefundable = calculateMerchandisePaid(order)
                    .subtract(alreadyAllocated)
                    .max(BigDecimal.ZERO);
            if (calculatedRefund.compareTo(remainingRefundable) > 0) {
                BigDecimal amountLeft = remainingRefundable;
                for (ReturnItem item : items) {
                    BigDecimal allocated = item.getRefundPrice().min(amountLeft);
                    item.setRefundPrice(allocated);
                    amountLeft = amountLeft.subtract(allocated);
                }
                calculatedRefund = remainingRefundable;
            }
        }

        returnRequest.setRefundAmount(calculatedRefund);
        returnRequest.getItems().addAll(items);

        if (type == ReturnType.EXCHANGE) {
            long totalReturnQuantity = items.stream()
                    .map(ReturnItem::getQuantity)
                    .mapToLong(Integer::longValue)
                    .sum();
            long totalExchangeQuantity = request.getExchangeItems().stream()
                    .map(CreateExchangeItemRequest::getNewQuantity)
                    .mapToLong(Integer::longValue)
                    .sum();
            if (totalExchangeQuantity != totalReturnQuantity) {
                throw new BadRequestException(
                        "Tổng số lượng giao đổi (" + totalExchangeQuantity
                                + ") phải bằng tổng số lượng khách trả ("
                                + totalReturnQuantity + ")");
            }

            long distinctExchangeVariants = request.getExchangeItems().stream()
                    .map(CreateExchangeItemRequest::getNewVariantId)
                    .distinct()
                    .count();
            if (distinctExchangeVariants != request.getExchangeItems().size()) {
                throw new BadRequestException("Không được khai báo trùng biến thể đổi mới");
            }

            Map<Long, Integer> returnedQuantityBySourceVariant = items.stream()
                    .collect(Collectors.toMap(
                            item -> item.getVariant().getVariantId(),
                            ReturnItem::getQuantity,
                            Integer::sum));
            Map<Long, Integer> exchangeQuantityBySourceVariant = request.getExchangeItems().stream()
                    .collect(Collectors.groupingBy(
                            CreateExchangeItemRequest::getSourceVariantId,
                            Collectors.summingInt(CreateExchangeItemRequest::getNewQuantity)));
            exchangeQuantityBySourceVariant.forEach((sourceVariantId, exchangeQuantity) -> {
                Integer returnedQuantity = returnedQuantityBySourceVariant.get(sourceVariantId);
                if (returnedQuantity == null) {
                    throw new BadRequestException("Sản phẩm nguồn không thuộc danh sách hàng lỗi đã chọn: " + sourceVariantId);
                }
                if (exchangeQuantity > returnedQuantity) {
                    throw new BadRequestException("Số lượng giao đổi vượt số lượng hàng lỗi của biến thể " + sourceVariantId);
                }
            });
            returnedQuantityBySourceVariant.forEach((sourceVariantId, returnedQuantity) -> {
                int exchangeQuantity = exchangeQuantityBySourceVariant.getOrDefault(sourceVariantId, 0);
                if (exchangeQuantity != returnedQuantity) {
                    throw new BadRequestException("Phải phân bổ đủ " + returnedQuantity
                            + " sản phẩm giao đổi cho biến thể lỗi " + sourceVariantId);
                }
            });

            List<Promotion> activePromotions =
                    promotionRepository.findActivePromotions(LocalDateTime.now());
            List<ExchangeItem> exchangeItems = request.getExchangeItems().stream()
                    .map(item -> {
                        OrderDetail sourceDetail = orderDetailsByVariant.get(item.getSourceVariantId());
                        if (sourceDetail == null || sourceDetail.getVariant() == null) {
                            throw new BadRequestException("Sản phẩm lỗi cần đổi không thuộc hóa đơn");
                        }
                        ProductVariant variant = variantRepository.findById(item.getNewVariantId())
                                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể sản phẩm mới"));
                        Long sourceProductId = sourceDetail.getVariant().getProduct().getProductId();
                        Long replacementProductId = variant.getProduct().getProductId();
                        if (!sourceProductId.equals(replacementProductId)) {
                            throw new BadRequestException("Sản phẩm thay thế phải cùng sản phẩm với hàng lỗi khách gửi lại: "
                                    + sourceDetail.getProductName());
                        }
                        if (variant.getAvailableStock() < item.getNewQuantity()) {
                            throw new BadRequestException("Sản phẩm đổi không đủ hàng: " + variant.getProduct().getProductName());
                        }
                        BigDecimal sourcePrice = sourceDetail.getSalePrice() != null
                                && sourceDetail.getSalePrice().compareTo(BigDecimal.ZERO) > 0
                                ? sourceDetail.getSalePrice()
                                : sourceDetail.getPrice();
                        BigDecimal replacementPrice = resolveEffectiveVariantPrice(
                                variant, activePromotions);
                        boolean sameSizeAndColor =
                                sameExchangeAttribute(sourceDetail.getSize(), variant.getSize())
                                && sameExchangeAttribute(sourceDetail.getColor(), variant.getColor());
                        if (!sameSizeAndColor && replacementPrice.compareTo(
                                sourcePrice != null ? sourcePrice : BigDecimal.ZERO) != 0) {
                            throw new BadRequestException(
                                    "Sản phẩm thay thế khác kích cỡ hoặc màu sắc phải cùng giá với hàng lỗi: "
                                            + sourceDetail.getProductName());
                        }
                        return ExchangeItem.builder()
                                .returnRequest(returnRequest)
                                .sourceVariant(sourceDetail.getVariant())
                                .newVariant(variant)
                                .newProductName(variant.getProduct().getProductName())
                                .newColor(variant.getColor())
                                .newSize(variant.getSize())
                                .newQuantity(item.getNewQuantity())

                                .priceDifference(replacementPrice.subtract(
                                        sourcePrice != null ? sourcePrice : BigDecimal.ZERO))
                                .build();
                    })
                    .toList();
            returnRequest.getExchangeItems().addAll(exchangeItems);
        }

        return toResponse(returnRepository.save(returnRequest));
    }

    private boolean sameExchangeAttribute(String source, String replacement) {
        String normalizedSource = source == null ? "" : source.trim();
        String normalizedReplacement = replacement == null ? "" : replacement.trim();
        return normalizedSource.equalsIgnoreCase(normalizedReplacement);
    }

    private BigDecimal resolveEffectiveVariantPrice(
            ProductVariant variant,
            List<Promotion> activePromotions
    ) {
        BigDecimal originalPrice = variant.getPrice() != null
                ? variant.getPrice()
                : BigDecimal.ZERO;
        BigDecimal bestPrice = originalPrice;
        if (activePromotions == null || activePromotions.isEmpty()) {
            return bestPrice;
        }

        Product product = variant.getProduct();
        Long productId = product != null ? product.getProductId() : null;
        Long categoryId = product != null && product.getCategory() != null
                ? product.getCategory().getCategoryId()
                : null;

        for (Promotion promotion : activePromotions) {
            if (!promotion.appliesToVariant(
                    variant.getVariantId(), productId, categoryId)) {
                continue;
            }
            BigDecimal promotionalPrice;
            if (promotion.isPercentage()) {
                BigDecimal discount = originalPrice
                        .multiply(promotion.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 0,
                                java.math.RoundingMode.HALF_UP);
                if (promotion.getMaxDiscountAmount() != null) {
                    discount = discount.min(promotion.getMaxDiscountAmount());
                }
                promotionalPrice = originalPrice.subtract(discount)
                        .max(BigDecimal.ZERO);
            } else {
                promotionalPrice = originalPrice
                        .subtract(promotion.getDiscountValue())
                        .max(BigDecimal.ZERO);
            }
            if (promotionalPrice.compareTo(bestPrice) < 0) {
                bestPrice = promotionalPrice;
            }
        }
        return bestPrice;
    }

    @Override
    public ReturnResponse approve(Long id) {
        ReturnRequest returnRequest = findByIdForUpdate(id);
        if (returnRequest.getStatus() != ReturnStatus.PENDING) {
            throw new BadRequestException("Chỉ duyệt yêu cầu đang chờ xử lý");
        }

        refreshRefundFromPurchaseSnapshot(returnRequest);
        returnRequest.setStatus(ReturnStatus.APPROVED);
        returnRequest.setProcessedBy(getCurrentUserOrNull());
        return toResponse(returnRepository.save(returnRequest));
    }

    @Override
    public ReturnResponse reject(Long id, RejectReturnRequest request) {
        ReturnRequest returnRequest = findByIdForUpdate(id);
        if (returnRequest.getStatus() != ReturnStatus.PENDING
                && returnRequest.getStatus() != ReturnStatus.APPROVED) {
            throw new BadRequestException("Không thể từ chối yêu cầu ở trạng thái hiện tại");
        }

        returnRequest.setStatus(ReturnStatus.REJECTED);
        returnRequest.setRejectReason(request.getRejectReason());
        returnRequest.setProcessedBy(getCurrentUserOrNull());
        return toResponse(returnRepository.save(returnRequest));
    }

    @Override
    @Transactional
    public ReturnResponse complete(Long id, com.base.dto.request.returnRequest.CompleteReturnRequest request) {
        ReturnRequest returnRequest = findByIdForUpdate(id);
        if (returnRequest.getStatus() != ReturnStatus.APPROVED) {
            throw new BadRequestException("Chỉ hoàn tất yêu cầu đã được duyệt");
        }

        if (request == null) {
            request = new com.base.dto.request.returnRequest.CompleteReturnRequest();
        }

        if (request != null && request.getItems() != null) {
            Set<Long> submittedIds = new HashSet<>();
            for (com.base.dto.request.returnRequest.CompleteReturnRequest.ReturnItemDamagedQtyRequest reqItem : request.getItems()) {
                if (!submittedIds.add(reqItem.getReturnItemId())) {
                    throw new BadRequestException("Sản phẩm đổi hàng bị gửi trùng: " + reqItem.getReturnItemId());
                }
                ReturnItem targetItem = returnRequest.getItems().stream()
                        .filter(item -> item.getReturnItemId().equals(reqItem.getReturnItemId()))
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException(
                                "Return item không thuộc yêu cầu này: " + reqItem.getReturnItemId()));
                int qty = reqItem.getDamagedQuantity() != null ? reqItem.getDamagedQuantity() : 0;
                if (qty < 0 || qty > targetItem.getQuantity()) {
                    throw new BadRequestException("Số lượng hỏng không hợp lệ: " + qty
                            + " cho sản phẩm: " + targetItem.getProductName());
                }
                targetItem.setDamagedQuantity(qty);
            }
        }

        User currentUser = getCurrentUserOrNull();

        Order order = returnRequest.getOrder();
        refreshRefundFromPurchaseSnapshot(returnRequest);

        Map<Long, ProductVariant> lockedVariants = lockReturnVariants(returnRequest);

        if (returnRequest.getReturnType() == ReturnType.EXCHANGE) {
            for (ExchangeItem item : returnRequest.getExchangeItems()) {
                ProductVariant newVar = lockedVariants.get(item.getNewVariant().getVariantId());
                if (newVar == null || newVar.getAvailableStock() < item.getNewQuantity()) {
                    throw new BadRequestException("Không đủ tồn kho sản phẩm mới để đổi: " + item.getNewProductName());
                }
                item.setNewVariant(newVar);
            }
        }

        Map<Long, Integer> orderedQuantityByVariant = order.getOrderDetails().stream()
                .filter(detail -> detail.getVariant() != null)
                .collect(Collectors.toMap(
                        detail -> detail.getVariant().getVariantId(),
                        OrderDetail::getQuantity,
                        Integer::sum
                ));
        Map<Long, Integer> currentReturnQuantityByVariant = returnRequest.getItems().stream()
                .filter(item -> item.getVariant() != null)
                .collect(Collectors.toMap(
                        item -> item.getVariant().getVariantId(),
                        ReturnItem::getQuantity,
                        Integer::sum
                ));
        boolean isFullReturn = orderedQuantityByVariant.entrySet().stream()
                .allMatch(entry -> returnRepository.sumCompletedReturnedQuantity(
                                order.getOrderId(), entry.getKey())
                        + currentReturnQuantityByVariant.getOrDefault(entry.getKey(), 0)
                        >= entry.getValue());

        for (ReturnItem item : returnRequest.getItems()) {
            ProductVariant variant = item.getVariant() != null
                    ? lockedVariants.get(item.getVariant().getVariantId())
                    : null;
            if (variant != null) {
                item.setVariant(variant);
                int damaged = item.getDamagedQuantity() != null ? item.getDamagedQuantity() : 0;
                int restoreQty = Math.max(0, item.getQuantity() - damaged);
                if (restoreQty > 0) {
                    variant.setStockQuantity(variant.getStockQuantity() + restoreQty);
                    variantRepository.save(variant);
                }
            }
        }

        if (returnRequest.getReturnType() == ReturnType.EXCHANGE) {
            for (ExchangeItem item : returnRequest.getExchangeItems()) {
                ProductVariant newVar = item.getNewVariant();
                newVar.setStockQuantity(newVar.getStockQuantity() - item.getNewQuantity());
                variantRepository.save(newVar);
            }
            createExchangeDelivery(returnRequest, currentUser);
        }

        returnRequest.setStatus(ReturnStatus.COMPLETED);
        returnRequest.setProcessedBy(currentUser);
        returnRequest.setProcessedImages(request.getProcessedImages());

        if (isFullReturn && returnRequest.getReturnType() == ReturnType.REFUND) {
            order.setOrderStatus(OrderStatus.REFUNDED);
            if (order.getCoupon() != null) {
                couponRepository.decrementUsedQuantity(order.getCoupon().getCouponId());
            }
            order.setNote((order.getNote() != null ? order.getNote() : "") + "\n[Đã hoàn hàng toàn bộ]");
        } else {

            String returnDesc = returnRequest.getItems().stream()
                    .map(item -> String.format("%s (Size: %s, Màu: %s) x %d", item.getProductName(), item.getSize(), item.getColor(), item.getQuantity()))
                    .collect(Collectors.joining(", "));
            String appendNote = String.format("\n[Đã đổi hàng 1 phần ngày %s: %s.]",
                    LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                    returnDesc
            );
            order.setNote((order.getNote() != null ? order.getNote() : "") + appendNote);
        }

        orderRepository.save(order);

        OrderStatus nextStatus = order.getOrderStatus();
        OrderTransactionLog logEntry = OrderTransactionLog.builder()
                .order(order)
                .previousStatus(OrderStatus.COMPLETED)
                .currentStatus(nextStatus)
                .action(isFullReturn
                        ? (returnRequest.getReturnType() == ReturnType.EXCHANGE ? "Đổi hàng toàn bộ" : "Hoàn trả toàn bộ")
                        : (returnRequest.getReturnType() == ReturnType.EXCHANGE ? "Đổi hàng một phần" : "Hoàn đổi hàng một phần"))
                .note(returnRequest.getNote())
                .createdBy(currentUser != null ? currentUser.getFullName() : "Hệ thống")
                .build();
        orderTransactionLogRepository.save(logEntry);

        return toResponse(returnRepository.save(returnRequest));
    }

    private void createExchangeDelivery(ReturnRequest returnRequest, User currentUser) {
        if (exchangeDeliveryRepository.findByReturnRequest_ReturnId(returnRequest.getReturnId()).isPresent()) {
            return;
        }
        boolean storePickup = returnRequest.getExchangeFulfillmentMethod()
                == com.base.enums.ExchangeFulfillmentMethod.STORE_PICKUP;
        String receiverName = isBlank(returnRequest.getExchangeReceiverName())
                ? "Khách hàng" : returnRequest.getExchangeReceiverName().trim();
        String receiverPhone = isBlank(returnRequest.getExchangeReceiverPhone())
                ? "" : returnRequest.getExchangeReceiverPhone().trim();
        ExchangeDelivery delivery = ExchangeDelivery.builder()
                .returnRequest(returnRequest)
                .deliveryCode("DGH-" + returnRequest.getReturnId())
                .status(storePickup ? com.base.enums.ExchangeDeliveryStatus.DELIVERED
                        : com.base.enums.ExchangeDeliveryStatus.PREPARING)
                .fulfillmentMethod(returnRequest.getExchangeFulfillmentMethod())
                .receiverName(receiverName)
                .receiverPhone(receiverPhone)
                .deliveryAddress(storePickup ? "Nhận tại cửa hàng" : returnRequest.getExchangeDeliveryAddress())
                .shippingFee(storePickup ? BigDecimal.ZERO : returnRequest.getExchangeShippingFee())
                .deliveredAt(storePickup ? LocalDateTime.now() : null)
                .note(storePickup ? "Khách nhận sản phẩm đổi tại cửa hàng" : "Giao sản phẩm đổi cho hóa đơn " + returnRequest.getOrderCode())
                .build();
        delivery.getLogs().add(com.base.entity.ExchangeDeliveryLog.builder()
                .exchangeDelivery(delivery)
                .previousStatus(null)
                .currentStatus(delivery.getStatus())
                .note(storePickup ? "Khách đã nhận sản phẩm đổi tại cửa hàng" : "Đã tạo phiếu giao sản phẩm đổi")
                .createdBy(currentUser)
                .build());
        exchangeDeliveryRepository.save(delivery);
    }

    private void applyExchangeFulfillment(ReturnRequest target, CreateReturnRequest request) {
        var method = target.getExchangeFulfillmentMethod();
        if (method == com.base.enums.ExchangeFulfillmentMethod.STORE_PICKUP) {
            target.setExchangeReceiverName(resolveCustomerName(request, target.getOrder()));
            String pickupPhone = resolveCustomerPhone(request, target.getOrder());
            target.setExchangeReceiverPhone(isBlank(pickupPhone) ? "" : pickupPhone);
            target.setExchangeDeliveryAddress("Nhận tại cửa hàng");
            target.setExchangeShippingFee(BigDecimal.ZERO);
            return;
        }
        var address = request.getExchangeDeliveryAddress();
        if (address == null) {
            throw new BadRequestException("Vui lòng nhập địa chỉ giao sản phẩm đổi");
        }
        if (isBlank(address.getReceiverName())) {
            throw new BadRequestException("Vui lòng nhập tên người nhận sản phẩm đổi");
        }
        if (isBlank(address.getReceiverPhone())) {
            throw new BadRequestException("Vui lòng nhập số điện thoại người nhận sản phẩm đổi");
        }
        BigDecimal shippingFee = request.getExchangeShippingFee() != null
                ? request.getExchangeShippingFee() : BigDecimal.ZERO;
        if (shippingFee.signum() < 0) {
            throw new BadRequestException("Phí vận chuyển không được âm");
        }
        target.setExchangeReceiverName(address.getReceiverName());
        target.setExchangeReceiverPhone(address.getReceiverPhone());
        target.setExchangeDeliveryAddress(java.util.stream.Stream.of(
                        address.getDetailAddress(), address.getWard(), address.getProvince())
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(", ")));
        target.setExchangeShippingFee(shippingFee);
    }

    private BigDecimal calculateProportionalRefund(
            BigDecimal itemEffectiveSubtotal,   
            Order order
    ) {

        BigDecimal orderSubtotal = calculateStoredSubtotal(order.getOrderDetails());

        if (orderSubtotal.compareTo(BigDecimal.ZERO) == 0) {
            return itemEffectiveSubtotal;
        }

        BigDecimal merchandisePaid = calculateMerchandisePaid(order);

        if (merchandisePaid.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal refund = merchandisePaid
                .multiply(itemEffectiveSubtotal)
                .divide(orderSubtotal, 0, java.math.RoundingMode.HALF_UP);

        return refund.max(BigDecimal.ZERO);
    }

    private BigDecimal calculateMerchandisePaid(Order order) {
        BigDecimal finalAmount = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        return finalAmount.subtract(shippingFee).max(BigDecimal.ZERO);
    }

    private ReturnItem buildReturnItem(
            CreateReturnItemRequest item,
            Order order,
            Map<Long, OrderDetail> orderDetailsByVariant,
            ReturnRequest returnRequest
    ) {
        OrderDetail orderDetail = orderDetailsByVariant.get(item.getVariantId());
        if (orderDetail == null) {
            throw new BadRequestException("Sản phẩm trả không thuộc đơn hàng: variantId=" + item.getVariantId());
        }

        int returnedQty = returnRepository.sumActiveReturnedQuantity(order.getOrderId(), item.getVariantId());
        List<OrderDetail> matchingOrderDetails = order.getOrderDetails().stream()
                .filter(detail -> detail.getVariant() != null
                        && item.getVariantId().equals(detail.getVariant().getVariantId()))
                .toList();
        int purchasedQuantity = matchingOrderDetails.stream()
                .mapToInt(OrderDetail::getQuantity)
                .sum();
        if (returnedQty + item.getQuantity() > purchasedQuantity) {
            throw new BadRequestException("Số lượng trả vượt quá số lượng đã mua: " + orderDetail.getProductName());
        }

        ProductVariant variant = variantRepository.findById(item.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể sản phẩm"));

        BigDecimal purchasedQty = BigDecimal.valueOf(purchasedQuantity);
        BigDecimal returnQtyBD = BigDecimal.valueOf(item.getQuantity());
        BigDecimal fullLineSubtotal = calculateStoredSubtotal(matchingOrderDetails);
        BigDecimal purchasedUnitPrice = fullLineSubtotal.divide(
                purchasedQty,
                2,
                java.math.RoundingMode.HALF_UP
        );
        BigDecimal itemEffectiveSubtotal = fullLineSubtotal
                .multiply(returnQtyBD)
                .divide(purchasedQty, 2, java.math.RoundingMode.HALF_UP);

        BigDecimal refundPrice = calculateProportionalRefund(itemEffectiveSubtotal, order);

        return ReturnItem.builder()
                .returnRequest(returnRequest)
                .variant(variant)
                .productId(item.getProductId() != null
                        ? item.getProductId()
                        : variant.getProduct().getProductId())
                .productName(item.getProductName() != null
                        ? item.getProductName()
                        : orderDetail.getProductName())
                .sku(item.getSku() != null ? item.getSku() : (variant != null ? variant.getVariantCode() : null))
                .color(item.getColor() != null ? item.getColor() : orderDetail.getColor())
                .size(item.getSize() != null ? item.getSize() : orderDetail.getSize())
                .quantity(item.getQuantity())
                .originalPrice(purchasedUnitPrice)
                .refundPrice(refundPrice)
                .reason(item.getReason())
                .build();
    }

    private BigDecimal calculateStoredSubtotal(List<OrderDetail> orderDetails) {
        return orderDetails.stream()
                .map(this::resolveStoredLineSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal resolveStoredLineSubtotal(OrderDetail detail) {
        if (detail.getSubtotal() != null) {
            return detail.getSubtotal().max(BigDecimal.ZERO);
        }

        int quantity = detail.getQuantity() != null ? detail.getQuantity() : 0;
        BigDecimal storedUnitPrice = detail.getSalePrice() != null
                && detail.getSalePrice().compareTo(BigDecimal.ZERO) > 0
                ? detail.getSalePrice()
                : (detail.getPrice() != null ? detail.getPrice() : BigDecimal.ZERO);
        return storedUnitPrice
                .multiply(BigDecimal.valueOf(quantity))
                .max(BigDecimal.ZERO);
    }

    private void refreshRefundFromPurchaseSnapshot(ReturnRequest returnRequest) {
        if (returnRequest.getReturnType() != ReturnType.REFUND) {
            return;
        }

        Order order = returnRequest.getOrder();
        for (ReturnItem item : returnRequest.getItems()) {
            if (item.getVariant() == null) {
                throw new BadRequestException(
                        "Không xác định được biến thể của sản phẩm trả: "
                                + item.getProductName());
            }

            Long variantId = item.getVariant().getVariantId();
            List<OrderDetail> matchingOrderDetails = order.getOrderDetails().stream()
                    .filter(detail -> detail.getVariant() != null
                            && variantId.equals(detail.getVariant().getVariantId()))
                    .toList();
            int purchasedQuantity = matchingOrderDetails.stream()
                    .map(OrderDetail::getQuantity)
                    .filter(java.util.Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();
            if (purchasedQuantity <= 0 || item.getQuantity() == null
                    || item.getQuantity() <= 0
                    || item.getQuantity() > purchasedQuantity) {
                throw new BadRequestException(
                        "Số lượng trả không hợp lệ: " + item.getProductName());
            }

            BigDecimal purchasedQty = BigDecimal.valueOf(purchasedQuantity);
            BigDecimal storedSubtotal = calculateStoredSubtotal(
                    matchingOrderDetails);
            BigDecimal purchasedUnitPrice = storedSubtotal.divide(
                    purchasedQty,
                    2,
                    java.math.RoundingMode.HALF_UP
            );
            BigDecimal returnedSubtotal = storedSubtotal
                    .multiply(BigDecimal.valueOf(item.getQuantity()))
                    .divide(purchasedQty, 2, java.math.RoundingMode.HALF_UP);

            item.setOriginalPrice(purchasedUnitPrice);
            item.setRefundPrice(calculateProportionalRefund(
                    returnedSubtotal,
                    order
            ));
        }

        BigDecimal calculatedRefund = returnRequest.getItems().stream()
                .map(ReturnItem::getRefundPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal allocatedByOtherReturns =
                returnRepository.sumAllocatedRefundAmountExcludingReturn(
                        order.getOrderId(),
                        returnRequest.getReturnId()
                );
        if (allocatedByOtherReturns == null) {
            allocatedByOtherReturns = BigDecimal.ZERO;
        }
        BigDecimal remainingRefundable = calculateMerchandisePaid(order)
                .subtract(allocatedByOtherReturns)
                .max(BigDecimal.ZERO);

        if (calculatedRefund.compareTo(remainingRefundable) > 0) {
            BigDecimal amountLeft = remainingRefundable;
            for (ReturnItem item : returnRequest.getItems()) {
                BigDecimal allocated = item.getRefundPrice().min(amountLeft);
                item.setRefundPrice(allocated);
                amountLeft = amountLeft.subtract(allocated);
            }
            calculatedRefund = remainingRefundable;
        }
        returnRequest.setRefundAmount(calculatedRefund);
    }

    private ReturnRequest findByIdWithItems(Long id) {
        return returnRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu đổi hàng"));
    }

    private ReturnRequest findByIdForUpdate(Long id) {
        return returnRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu đổi hàng"));
    }

    private Map<Long, ProductVariant> lockReturnVariants(ReturnRequest returnRequest) {
        Set<Long> variantIds = new TreeSet<>();
        returnRequest.getItems().stream()
                .map(ReturnItem::getVariant)
                .filter(java.util.Objects::nonNull)
                .map(ProductVariant::getVariantId)
                .forEach(variantIds::add);
        returnRequest.getExchangeItems().stream()
                .map(ExchangeItem::getNewVariant)
                .filter(java.util.Objects::nonNull)
                .map(ProductVariant::getVariantId)
                .forEach(variantIds::add);

        Map<Long, ProductVariant> locked = new HashMap<>();
        for (Long variantId : variantIds) {
            ProductVariant variant = variantRepository.findByIdForUpdate(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy biến thể sản phẩm: " + variantId));
            locked.put(variantId, variant);
        }
        return locked;
    }

    private String resolveCustomerName(CreateReturnRequest request, Order order) {
        if (!isBlank(request.getCustomerName())) {
            return request.getCustomerName().trim();
        }
        if (order.getCustomer() != null && !isBlank(order.getCustomer().getFullName())) {
            return order.getCustomer().getFullName();
        }
        if (order.getOrderAddress() != null && !isBlank(order.getOrderAddress().getReceiverName())) {
            return order.getOrderAddress().getReceiverName();
        }
        return "Khách hàng";
    }

    private String resolveCustomerPhone(CreateReturnRequest request, Order order) {
        if (!isBlank(request.getCustomerPhone())) {
            return request.getCustomerPhone().trim();
        }
        if (order.getCustomer() != null && !isBlank(order.getCustomer().getPhone())) {
            return order.getCustomer().getPhone();
        }
        if (order.getOrderAddress() != null && !isBlank(order.getOrderAddress().getReceiverPhone())) {
            return order.getOrderAddress().getReceiverPhone();
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private Long getCurrentPrincipalIdOrNull() {
        try {
            return securityUtils.getCurrentUserId();
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean isCurrentPrincipalStaff() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            return authentication != null
                    && authentication.isAuthenticated()
                    && authentication.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority())
                            || "ROLE_STAFF".equals(authority.getAuthority()));
        } catch (Exception ignored) {
            return false;
        }
    }

    private User getCurrentUserOrNull() {
        if (!isCurrentPrincipalStaff()) {
            return null;
        }
        try {
            Long userId = securityUtils.getCurrentUserId();
            return userRepository.findById(userId).orElse(null);
        } catch (Exception ignored) {
            return null;
        }
    }

    private ReturnResponse toResponse(ReturnRequest returnRequest) {
        User processedBy = returnRequest.getProcessedBy();
        return ReturnResponse.builder()
                .returnId(returnRequest.getReturnId())
                .orderId(returnRequest.getOrder().getOrderId())
                .customerId(returnRequest.getCustomer() != null
                        ? returnRequest.getCustomer().getCustomerId() : null)
                .customerCode(returnRequest.getCustomer() != null
                        ? returnRequest.getCustomer().getCustomerCode() : null)
                .orderCode(returnRequest.getOrderCode())
                .customerName(returnRequest.getCustomerName())
                .customerPhone(returnRequest.getCustomerPhone())
                .refundAmount(returnRequest.getRefundAmount())
                .status(returnRequest.getStatus())
                .returnType(returnRequest.getReturnType())
                .exchangeFulfillmentMethod(returnRequest.getExchangeFulfillmentMethod())
                .exchangeReceiverName(returnRequest.getExchangeReceiverName())
                .exchangeReceiverPhone(returnRequest.getExchangeReceiverPhone())
                .exchangeDeliveryAddress(returnRequest.getExchangeDeliveryAddress())
                .exchangeShippingFee(returnRequest.getExchangeShippingFee())
                .note(returnRequest.getNote())
                .rejectReason(returnRequest.getRejectReason())
                .images(returnRequest.getImages())
                .processedImages(returnRequest.getProcessedImages())
                .processedById(processedBy != null ? processedBy.getUserId() : null)
                .processedByName(processedBy != null
                        ? (!isBlank(processedBy.getFullName())
                                ? processedBy.getFullName()
                                : processedBy.getUsername())
                        : null)
                .createdAt(returnRequest.getCreatedAt())
                .updatedAt(returnRequest.getUpdatedAt())
                .items(returnRequest.getItems().stream()
                        .map(this::toItemResponse)
                        .toList())
                .exchangeItems(returnRequest.getExchangeItems() != null ? returnRequest.getExchangeItems().stream()
                        .map(this::toExchangeItemResponse)
                        .toList() : java.util.Collections.emptyList())
                .exchangeDelivery(exchangeDeliveryRepository.findByReturnRequest_ReturnId(returnRequest.getReturnId())
                        .map(delivery -> ExchangeDeliverySummaryResponse.builder()
                                .exchangeDeliveryId(delivery.getExchangeDeliveryId())
                                .deliveryCode(delivery.getDeliveryCode())
                                .status(delivery.getStatus())
                                .fulfillmentMethod(delivery.getFulfillmentMethod())
                                .shippedAt(delivery.getShippedAt())
                                .deliveredAt(delivery.getDeliveredAt())
                                .updatedAt(delivery.getUpdatedAt())
                                .build())
                        .orElse(null))
                .build();
    }

    private ReturnItemResponse toItemResponse(ReturnItem item) {
        String imageUrl = null;
        if (item.getVariant() != null && item.getVariant().getImage() != null) {
            imageUrl = item.getVariant().getImage().getImageUrl();
        } else if (item.getVariant() != null && item.getVariant().getProduct() != null
                && item.getVariant().getProduct().getImages() != null
                && !item.getVariant().getProduct().getImages().isEmpty()) {
            imageUrl = item.getVariant().getProduct().getImages().get(0).getImageUrl();
        }

        return ReturnItemResponse.builder()
                .returnItemId(item.getReturnItemId())
                .productId(item.getProductId())
                .productCode(item.getVariant() != null && item.getVariant().getProduct() != null ? item.getVariant().getProduct().getProductCode() : null)
                .productSlug(item.getVariant() != null && item.getVariant().getProduct() != null ? item.getVariant().getProduct().getProductSlug() : null)
                .productName(item.getProductName())
                .variantId(item.getVariant() != null ? item.getVariant().getVariantId() : null)
                .sku(item.getSku())
                .imageUrl(imageUrl)
                .color(item.getColor())
                .size(item.getSize())
                .quantity(item.getQuantity())
                .damagedQuantity(item.getDamagedQuantity())
                .originalPrice(item.getOriginalPrice())
                .refundPrice(item.getRefundPrice())
                .reason(item.getReason())
                .build();
    }

    private ExchangeItemResponse toExchangeItemResponse(ExchangeItem item) {
        String imageUrl = null;
        if (item.getNewVariant() != null && item.getNewVariant().getImage() != null) {
            imageUrl = item.getNewVariant().getImage().getImageUrl();
        } else if (item.getNewVariant() != null && item.getNewVariant().getProduct() != null
                && item.getNewVariant().getProduct().getImages() != null
                && !item.getNewVariant().getProduct().getImages().isEmpty()) {
            imageUrl = item.getNewVariant().getProduct().getImages().get(0).getImageUrl();
        }

        return ExchangeItemResponse.builder()
                .exchangeItemId(item.getExchangeItemId())
                .sourceVariantId(item.getSourceVariant() != null ? item.getSourceVariant().getVariantId() : null)
                .sourceProductName(item.getSourceVariant() != null && item.getSourceVariant().getProduct() != null
                        ? item.getSourceVariant().getProduct().getProductName() : null)
                .sourceColor(item.getSourceVariant() != null ? item.getSourceVariant().getColor() : null)
                .sourceSize(item.getSourceVariant() != null ? item.getSourceVariant().getSize() : null)
                .variantId(item.getNewVariant() != null ? item.getNewVariant().getVariantId() : null)
                .productId(item.getNewVariant() != null && item.getNewVariant().getProduct() != null ? item.getNewVariant().getProduct().getProductId() : null)
                .productCode(item.getNewVariant() != null && item.getNewVariant().getProduct() != null ? item.getNewVariant().getProduct().getProductCode() : null)
                .productSlug(item.getNewVariant() != null && item.getNewVariant().getProduct() != null ? item.getNewVariant().getProduct().getProductSlug() : null)
                .variantCode(item.getNewVariant() != null ? item.getNewVariant().getVariantCode() : null)
                .imageUrl(imageUrl)
                .productName(item.getNewProductName())
                .color(item.getNewColor())
                .size(item.getNewSize())
                .quantity(item.getNewQuantity())
                .priceDifference(item.getPriceDifference())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReturnResponse> getMyReturns(Long customerId, Pageable pageable) {
        return returnRepository.findByCustomerId(customerId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnResponse getMyReturnById(Long id, Long customerId) {
        ReturnRequest returnRequest = findByIdWithItems(id);
        if (returnRequest.getOrder().getCustomer() == null || !returnRequest.getOrder().getCustomer().getCustomerId().equals(customerId)) {
            throw new BadRequestException("Bạn không có quyền xem yêu cầu đổi hàng này");
        }
        return toResponse(returnRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public com.base.dto.response.returnRequest.RefundPreviewResponse calculateRefundPreview(
            com.base.dto.request.returnRequest.RefundPreviewRequest request
    ) {
        Order order = orderRepository.findByIdWithDetails(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        Long currentPrincipalId = getCurrentPrincipalIdOrNull();
        User currentUser = getCurrentUserOrNull();
        if (!isCurrentPrincipalStaff() && (currentPrincipalId == null
                || order.getCustomer() == null
                || !order.getCustomer().getCustomerId().equals(currentPrincipalId))) {
            throw new BadRequestException("Bạn không có quyền xem số tiền hoàn của đơn này");
        }
        if (order.getOrderStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Chỉ tính hoàn tiền cho đơn đã hoàn tất");
        }
        returnPolicy.validateReturnWindow(order);

        BigDecimal orderSubtotal = calculateStoredSubtotal(order.getOrderDetails());

        BigDecimal finalAmount = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal merchandisePaid = finalAmount.subtract(shippingFee).max(BigDecimal.ZERO);

        BigDecimal totalDiscount = orderSubtotal.subtract(merchandisePaid).max(BigDecimal.ZERO);

        long distinctPreviewVariants = request.getItems().stream()
                .map(com.base.dto.request.returnRequest.RefundPreviewRequest.PreviewItem::getVariantId)
                .distinct()
                .count();
        if (distinctPreviewVariants != request.getItems().size()) {
            throw new BadRequestException("Không được xem trước trùng biến thể");
        }

        Map<Long, OrderDetail> orderDetailsByVariant = order.getOrderDetails().stream()
                .filter(d -> d.getVariant() != null)
                .collect(Collectors.toMap(
                        d -> d.getVariant().getVariantId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));

        List<com.base.dto.response.returnRequest.RefundPreviewResponse.ItemPreview> itemPreviews =
                request.getItems().stream().map(reqItem -> {
                    OrderDetail od = orderDetailsByVariant.get(reqItem.getVariantId());
                    if (od == null) {
                        throw new BadRequestException("Sản phẩm không thuộc đơn hàng: variantId=" + reqItem.getVariantId());
                    }

                    int qty = reqItem.getQuantity() != null ? reqItem.getQuantity() : 1;
                    int alreadyReturned = returnRepository.sumActiveReturnedQuantity(
                            order.getOrderId(), reqItem.getVariantId());
                    List<OrderDetail> matchingOrderDetails = order.getOrderDetails().stream()
                            .filter(detail -> detail.getVariant() != null
                                    && reqItem.getVariantId().equals(
                                            detail.getVariant().getVariantId()))
                            .toList();
                    int purchasedQuantity = matchingOrderDetails.stream()
                            .map(OrderDetail::getQuantity)
                            .filter(java.util.Objects::nonNull)
                            .mapToInt(Integer::intValue)
                            .sum();
                    if (qty <= 0 || alreadyReturned + qty > purchasedQuantity) {
                        throw new BadRequestException("Số lượng xem trước hoàn trả không hợp lệ: " + od.getProductName());
                    }
                    BigDecimal purchasedQty = BigDecimal.valueOf(purchasedQuantity);
                    BigDecimal returnQtyBD = BigDecimal.valueOf(qty);

                    BigDecimal fullLineSubtotal = calculateStoredSubtotal(
                            matchingOrderDetails);
                    BigDecimal purchasedUnitPrice = fullLineSubtotal.divide(
                            purchasedQty,
                            2,
                            java.math.RoundingMode.HALF_UP
                    );
                    BigDecimal itemSubtotal = fullLineSubtotal
                            .multiply(returnQtyBD)
                            .divide(purchasedQty, 2, java.math.RoundingMode.HALF_UP);

                    BigDecimal refundAmt;
                    BigDecimal allocatedDiscount;
                    if (orderSubtotal.compareTo(BigDecimal.ZERO) > 0) {
                        refundAmt = merchandisePaid.compareTo(BigDecimal.ZERO) > 0
                                ? merchandisePaid
                                .multiply(itemSubtotal)
                                .divide(orderSubtotal, 0, java.math.RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;
                        allocatedDiscount = itemSubtotal
                                .subtract(refundAmt)
                                .max(BigDecimal.ZERO);
                    } else {
                        refundAmt = BigDecimal.ZERO;
                        allocatedDiscount = BigDecimal.ZERO;
                    }

                    return com.base.dto.response.returnRequest.RefundPreviewResponse.ItemPreview.builder()
                            .variantId(reqItem.getVariantId())
                            .productName(od.getProductName())
                            .color(od.getColor())
                            .size(od.getSize())
                            .quantity(qty)
                            .unitPrice(purchasedUnitPrice)
                            .lineSubtotal(itemSubtotal)
                            .allocatedDiscount(allocatedDiscount)
                            .refundAmount(refundAmt)
                            .build();
                }).toList();

        BigDecimal totalRefund = itemPreviews.stream()
                .map(com.base.dto.response.returnRequest.RefundPreviewResponse.ItemPreview::getRefundAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return com.base.dto.response.returnRequest.RefundPreviewResponse.builder()
                .totalRefund(totalRefund)
                .totalDiscount(totalDiscount)
                .orderSubtotal(orderSubtotal)
                .paidAmount(merchandisePaid)
                .items(itemPreviews)
                .build();
    }
}
