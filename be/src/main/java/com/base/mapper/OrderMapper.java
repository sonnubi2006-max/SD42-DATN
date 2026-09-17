package com.base.mapper;

import com.base.dto.response.order.OrderDetailResponse;
import com.base.dto.response.order.OrderResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.dto.response.order.OrderTransactionLogResponse;
import com.base.dto.response.order.OrderTransactionLogImageResponse;
import com.base.dto.response.returnRequest.ExchangeItemResponse;
import com.base.dto.response.returnRequest.ReturnItemResponse;
import com.base.dto.response.returnRequest.ReturnResponse;
import com.base.entity.ExchangeItem;
import com.base.entity.Order;
import com.base.entity.OrderAddress;
import com.base.entity.OrderDetail;
import com.base.entity.ReturnItem;
import com.base.entity.ReturnRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;
import com.base.entity.Promotion;
import com.base.repository.PromotionRepository;
import com.base.repository.ReturnRequestRepository;
import com.base.repository.AddressRepository;
import com.base.repository.ExchangeDeliveryRepository;
import com.base.service.helper.OrderPriceCalculator;
import com.base.service.helper.ReturnPolicy;
import com.base.enums.ReturnType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderMapper {

    private final ModelMapper modelMapper;
    private final ReturnRequestRepository returnRepository;
    private final PromotionRepository promotionRepository;
    private final AddressRepository addressRepository;
    private final ExchangeDeliveryRepository exchangeDeliveryRepository;
    private final OrderPriceCalculator calculator;
    private final ReturnPolicy returnPolicy;

    public OrderDetailResponse toDetailResponse(OrderDetail detail) {
        OrderDetailResponse res = modelMapper.map(detail, OrderDetailResponse.class);
        int quantity = detail.getQuantity() != null ? detail.getQuantity() : 0;
        int damagedQuantity = detail.getDamagedQuantity() != null
                ? Math.max(0, Math.min(detail.getDamagedQuantity(), quantity))
                : 0;
        res.setDamagedQuantity(damagedQuantity);
        res.setUndamagedQuantity(quantity - damagedQuantity);
        BigDecimal purchasedUnitPrice;
        if (detail.getSubtotal() != null && quantity > 0) {
            purchasedUnitPrice = detail.getSubtotal().divide(
                    BigDecimal.valueOf(quantity),
                    2,
                    java.math.RoundingMode.HALF_UP
            );
        } else if (detail.getSalePrice() != null
                && detail.getSalePrice().compareTo(BigDecimal.ZERO) > 0) {
            purchasedUnitPrice = detail.getSalePrice();
        } else {
            purchasedUnitPrice = detail.getPrice();
        }
        res.setPurchasedUnitPrice(purchasedUnitPrice);
        if (detail.getVariant() != null) {
            res.setVariantId(detail.getVariant().getVariantId());
            int stockQuantity = detail.getVariant().getStockQuantity() != null ? detail.getVariant().getStockQuantity() : 0;
            if (detail.getOrder() != null && detail.getOrder().getOrderStatus() == com.base.enums.OrderStatus.DRAFT) {
                int itemQty = detail.getQuantity() != null ? detail.getQuantity() : 0;
                res.setStockQuantity(stockQuantity + itemQty);
            } else {
                res.setStockQuantity(stockQuantity);
            }
            res.setVariantCode(detail.getVariant().getVariantCode());
            if (detail.getVariant().getProduct() != null) {
                com.base.entity.Product product = detail.getVariant().getProduct();
                res.setProductId(product.getProductId());
                res.setProductCode(product.getProductCode());
                res.setProductSlug(product.getProductSlug());
            }
            if (res.getImageUrl() == null || res.getImageUrl().isBlank()) {
                if (detail.getVariant().getImage() != null) {
                    res.setImageUrl(detail.getVariant().getImage().getImageUrl());
                } else if (detail.getVariant().getProduct() != null &&
                        detail.getVariant().getProduct().getImages() != null &&
                        !detail.getVariant().getProduct().getImages().isEmpty()) {
                    res.setImageUrl(detail.getVariant().getProduct().getImages().get(0).getImageUrl());
                }
            }
            List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
            Long productId = detail.getVariant().getProduct() != null ? detail.getVariant().getProduct().getProductId() : null;
            Long categoryId = detail.getVariant().getProduct() != null && detail.getVariant().getProduct().getCategory() != null
                    ? detail.getVariant().getProduct().getCategory().getCategoryId()
                    : null;

            BigDecimal currentPrice = calculator.applyPromotionToUnit(
                    detail.getVariant().getPrice(),
                    detail.getVariant().getVariantId(),
                    productId,
                    categoryId,
                    activePromotions
            );
            res.setCurrentVariantPrice(currentPrice);

            int activeReturned = returnRepository.sumActiveReturnedQuantity(detail.getOrder().getOrderId(), detail.getVariant().getVariantId());
            int normalizedReturned = Math.max(0, Math.min(activeReturned, quantity));
            res.setReturnedQuantity(normalizedReturned);
            res.setRemainingReturnQuantity(quantity - normalizedReturned);
        } else {
            res.setReturnedQuantity(0);
            res.setRemainingReturnQuantity(quantity);
        }
        res.setIsReviewed(detail.getReview() != null);
        return res;
    }

    public List<OrderDetailResponse> toDetailResponseList(List<OrderDetail> details) {
        if (details == null) return Collections.emptyList();
        return details.stream().map(this::toDetailResponse).collect(Collectors.toList());
    }

    public OrderResponse toResponse(Order order) {
        OrderResponse res = modelMapper.map(order, OrderResponse.class);
        if (order.getCustomer() != null) {
            res.setCustomerId(order.getCustomer().getCustomerId());
            res.setCustomerSource(order.getCustomer().getSource());
            res.setCustomerName(order.getCustomer().getFullName());
            res.setCustomerPhone(order.getCustomer().getPhone());
            res.setCustomerEmail(order.getCustomer().getEmail());

            addressRepository.findByCustomerCustomerIdAndIsDefaultTrue(order.getCustomer().getCustomerId())
                    .ifPresent(address -> res.setCustomerAddress(joinAddressParts(
                            address.getStreetAddress(),
                            address.getWard(),
                            address.getProvince()
                    )));
        }
        if (order.getStaff() != null) {
            res.setStaffId(order.getStaff().getUserId());
            res.setStaffName(order.getStaff().getFullName());
        }

        if (order.getOrderAddress() != null) {
            OrderAddress addr = order.getOrderAddress();
            res.setReceiverName(addr.getReceiverName());
            res.setReceiverPhone(addr.getReceiverPhone());

            if (order.getCustomer() == null) {
                res.setGuestName(order.getGuestName() != null && !order.getGuestName().isBlank()
                        ? order.getGuestName()
                        : addr.getReceiverName());
                res.setGuestPhone(order.getGuestPhone() != null && !order.getGuestPhone().isBlank()
                        ? order.getGuestPhone()
                        : addr.getReceiverPhone());
                res.setGuestEmail(order.getGuestEmail());
            }

            StringBuilder sb = new StringBuilder();
            if (addr.getDetailAddress() != null && !addr.getDetailAddress().trim().isEmpty()) {
                sb.append(addr.getDetailAddress());
            }
            if (addr.getWard() != null && !addr.getWard().trim().isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(addr.getWard());
            }
            if (addr.getProvince() != null && !addr.getProvince().trim().isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(addr.getProvince());
            }
            res.setReceiverAddress(sb.toString());
        }

        if (order.getCouponCode() != null) {
            res.setCouponCode(order.getCouponCode());
        } else if (order.getCoupon() != null) {
            res.setCouponCode(order.getCoupon().getCode());
        }
        if (order.getCoupon() != null) {
            res.setCouponId(order.getCoupon().getCouponId());
        }

        res.setOrderDetails(toDetailResponseList(order.getOrderDetails()));

        List<ReturnRequest> completedReturns =
                returnRepository.findCompletedByOrderIdWithItems(order.getOrderId());
        BigDecimal completedRefundAmount = completedReturns.stream()
                .filter(returnRequest -> returnRequest.getReturnType() == ReturnType.REFUND)
                .map(ReturnRequest::getRefundAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal merchandiseRevenue = valueOrZero(order.getFinalAmount())
                .subtract(valueOrZero(order.getShippingFee()))
                .max(BigDecimal.ZERO);
        res.setCompletedReturnCount(completedReturns.size());
        res.setCompletedRefundAmount(completedRefundAmount);
        res.setNetRevenue(merchandiseRevenue.subtract(completedRefundAmount).max(BigDecimal.ZERO));
        res.setReturnRequests(completedReturns.stream()
                .map(this::toReturnResponse)
                .toList());

        ReturnPolicy.ReturnWindow returnWindow = returnPolicy.evaluate(order);
        res.setCompletedAt(returnWindow.completedAt());
        res.setReturnDeadline(returnWindow.deadline());
        boolean hasRemainingQuantity = res.getOrderDetails().stream()
                .anyMatch(detail -> detail.getRemainingReturnQuantity() != null
                        && detail.getRemainingReturnQuantity() > 0);
        res.setCanReturn(order.getOrderStatus() == com.base.enums.OrderStatus.COMPLETED
                && !returnWindow.expired()
                && hasRemainingQuantity);

        if (order.getTransactionLogs() != null) {
            res.setTransactionLogs(order.getTransactionLogs().stream()
                    .map(log -> {
                        OrderTransactionLogResponse response = new OrderTransactionLogResponse();
                        response.setLogId(log.getLogId());
                        response.setPreviousStatus(log.getPreviousStatus());
                        response.setCurrentStatus(log.getCurrentStatus());
                        response.setAction(log.getAction());
                        response.setNote(log.getNote());
                        response.setCreatedBy(log.getCreatedBy());
                        response.setCreatedAt(log.getCreatedAt());
                        response.setImages(log.getImages() == null
                                ? List.of()
                                : log.getImages().stream().map(image -> {
                                    OrderTransactionLogImageResponse imageResponse =
                                            new OrderTransactionLogImageResponse();
                                    imageResponse.setImageId(image.getImageId());
                                    imageResponse.setImageUrl(image.getImageUrl());
                                    imageResponse.setOriginalName(image.getOriginalName());
                                    imageResponse.setContentType(image.getContentType());
                                    imageResponse.setFileSize(image.getFileSize());
                                    imageResponse.setCreatedAt(image.getCreatedAt());
                                    return imageResponse;
                                }).toList());
                        return response;
                    })
                    .collect(Collectors.toList()));
        }

        return res;
    }

    private String joinAddressParts(String... parts) {
        return java.util.Arrays.stream(parts)
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(", "));
    }

    private ReturnResponse toReturnResponse(ReturnRequest returnRequest) {
        return ReturnResponse.builder()
                .returnId(returnRequest.getReturnId())
                .orderId(returnRequest.getOrder() != null
                        ? returnRequest.getOrder().getOrderId()
                        : null)
                .orderCode(returnRequest.getOrderCode())
                .customerId(returnRequest.getCustomer() != null
                        ? returnRequest.getCustomer().getCustomerId()
                        : null)
                .customerCode(returnRequest.getCustomer() != null
                        ? returnRequest.getCustomer().getCustomerCode()
                        : null)
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
                .processedById(returnRequest.getProcessedBy() != null
                        ? returnRequest.getProcessedBy().getUserId()
                        : null)
                .processedByName(resolveProcessedByName(returnRequest))
                .createdAt(returnRequest.getCreatedAt())
                .updatedAt(returnRequest.getUpdatedAt())
                .items(returnRequest.getItems() != null
                        ? returnRequest.getItems().stream()
                                .map(this::toReturnItemResponse)
                                .toList()
                        : List.of())
                .exchangeItems(returnRequest.getExchangeItems() != null
                        ? returnRequest.getExchangeItems().stream()
                                .map(this::toExchangeItemResponse)
                                .toList()
                        : List.of())
                .exchangeDelivery(exchangeDeliveryRepository
                        .findByReturnRequest_ReturnId(returnRequest.getReturnId())
                        .map(delivery -> com.base.dto.response.returnRequest.ExchangeDeliverySummaryResponse.builder()
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

    private ReturnItemResponse toReturnItemResponse(ReturnItem item) {
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
                .variantId(item.getVariant() != null
                        ? item.getVariant().getVariantId()
                        : null)
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
                .variantId(item.getNewVariant() != null
                        ? item.getNewVariant().getVariantId()
                        : null)
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

    private String resolveProcessedByName(ReturnRequest returnRequest) {
        if (returnRequest.getProcessedBy() == null) {
            return null;
        }
        String fullName = returnRequest.getProcessedBy().getFullName();
        return fullName != null && !fullName.isBlank()
                ? fullName
                : returnRequest.getProcessedBy().getUsername();
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    public OrderSummaryResponse toSummaryResponse(Order order) {
        OrderSummaryResponse res = modelMapper.map(order, OrderSummaryResponse.class);
        res.setTotalItems(order.getOrderDetails() == null ? 0 : order.getOrderDetails().size());

        if(order.getCustomer()!=null){
            res.setCustomerName(order.getCustomer().getFullName());
            res.setCustomerPhone(order.getCustomer().getPhone());
        } else {
            res.setCustomerName(order.getGuestName());
            res.setCustomerPhone(order.getGuestPhone());
        }

        if (order.getOrderAddress() != null) {
            res.setReceiverName(order.getOrderAddress().getReceiverName());
            res.setReceiverPhone(order.getOrderAddress().getReceiverPhone());
        }
        return res;
    }
}
