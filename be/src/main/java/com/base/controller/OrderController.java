package com.base.controller;

import com.base.dto.request.order.*;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.order.OrderResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.dto.response.order.ProductSalesStatisticResponse;
import com.base.dto.response.order.StaffSalesStatisticResponse;
import com.base.dto.response.order.TopRatedProductStatisticResponse;
import com.base.service.OrderService;
import com.base.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final SecurityUtils securityUtils;

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderResponse>> createOnlineOrder(
            @Valid @RequestBody CreateOrderOnlineRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(orderService.createOnlineOrder(
                        request, securityUtils.getCurrentUserIdOrNull())));
    }

    @PostMapping("/orders/guest/lookup")
    public ResponseEntity<ApiResponse<OrderResponse>> lookupGuestOrder(
            @Valid @RequestBody GuestOrderLookupRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.lookupGuestOrder(request)));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(orderId, getCurrentUserId())));
    }

    @GetMapping("/orders/code/{orderCode}")
    public ResponseEntity<ApiResponse<OrderResponse>> getByCode(
            @PathVariable String orderCode
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderByCode(orderCode, getCurrentUserId())));
    }

    @GetMapping("/orders/my")
    public ResponseEntity<ApiResponse<Page<OrderSummaryResponse>>> getMyOrders(
            OrderFilterRequest filter
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getMyOrders(getCurrentUserId(), filter)));
    }

    @PatchMapping("/orders/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(
            @PathVariable Long orderId,
            @RequestParam(required = false) String reason
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.cancelOrderByUser(orderId, getCurrentUserId(), reason)));
    }

    @PatchMapping("/orders/{orderId}/cancel-unpaid")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelUnpaid(
            @PathVariable Long orderId,
            @RequestParam(required = false) String reason
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.cancelUnpaidPaymentOrder(orderId, getCurrentUserId(), reason)));
    }

    @GetMapping("/manager/orders")
    public ResponseEntity<ApiResponse<Page<OrderSummaryResponse>>> adminFilterOrders(
            OrderFilterRequest filter
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.adminFilterOrders(filter)));
    }

    @GetMapping("/manager/orders/product-sales-statistics")
    public ResponseEntity<ApiResponse<List<ProductSalesStatisticResponse>>> getProductSalesStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getProductSalesStatistics(fromDate, toDate)));
    }

    @GetMapping("/manager/orders/staff-sales-statistics")
    public ResponseEntity<ApiResponse<List<StaffSalesStatisticResponse>>> getStaffSalesStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getStaffSalesStatistics(fromDate, toDate)));
    }

    @GetMapping("/manager/orders/top-rated-product-statistics")
    public ResponseEntity<ApiResponse<List<TopRatedProductStatisticResponse>>> getTopRatedProductStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getTopRatedProductStatistics(fromDate, toDate, limit)));
    }

    @GetMapping("/manager/orders/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> adminGetById(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.adminGetOrderById(orderId)));
    }

    @PutMapping(
            value = "/manager/orders/{orderId}/status",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.updateOrderStatus(orderId, request, getCurrentUserId())));
    }

    @PutMapping(
            value = "/manager/orders/{orderId}/status",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatusWithEvidence(
            @PathVariable Long orderId,
            @Valid @RequestPart("request") UpdateOrderStatusRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.updateOrderStatus(
                        orderId,
                        request,
                        getCurrentUserId(),
                        images
                )));
    }

    @PutMapping("/manager/orders/bulk-status")
    public ResponseEntity<ApiResponse<com.base.dto.response.order.BulkUpdateOrderStatusResponse>> bulkUpdateStatus(
            @Valid @RequestBody com.base.dto.request.order.BulkUpdateOrderStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.bulkUpdateOrderStatus(request, getCurrentUserId())));
    }

    @PostMapping("/manager/orders/pos")
    public ResponseEntity<ApiResponse<OrderResponse>> createPosOrder(
            @Valid @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(orderService.createPosOrder(request, getCurrentUserId())));
    }

    @PostMapping("/manager/orders/pos/draft")
    public ResponseEntity<ApiResponse<OrderResponse>> createPosDraft(
            @RequestParam(required = false) Long shiftId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(orderService.createPosDraft(getCurrentUserId(), shiftId)));
    }

    @GetMapping("/manager/orders/pos/drafts")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getPosDrafts() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getPosDrafts(getCurrentUserId())));
    }

    @PostMapping("/manager/orders/pos/{orderId}/items")
    public ResponseEntity<ApiResponse<OrderResponse>> addPosItem(
            @PathVariable Long orderId,
            @Valid @RequestBody PosAddItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.addPosItem(orderId, request, getCurrentUserId())));
    }

    @PatchMapping("/manager/orders/pos/{orderId}/items/{detailId}")
    public ResponseEntity<ApiResponse<OrderResponse>> updatePosItem(
            @PathVariable Long orderId,
            @PathVariable Long detailId,
            @Valid @RequestBody PosUpdateItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.updatePosItem(orderId, detailId, request, getCurrentUserId())));
    }

    @DeleteMapping("/manager/orders/pos/{orderId}/items/{detailId}")
    public ResponseEntity<ApiResponse<OrderResponse>> removePosItem(
            @PathVariable Long orderId,
            @PathVariable Long detailId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.removePosItem(orderId, detailId, getCurrentUserId())));
    }

    @PatchMapping("/manager/orders/pos/{orderId}/customer")
    public ResponseEntity<ApiResponse<OrderResponse>> attachPosCustomer(
            @PathVariable Long orderId,
            @Valid @RequestBody PosAttachCustomerRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.attachPosCustomer(orderId, request, getCurrentUserId())));
    }

    @PostMapping("/manager/orders/pos/{orderId}/checkout")
    public ResponseEntity<ApiResponse<OrderResponse>> checkoutPosOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody PosCheckoutRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.checkoutPosOrder(orderId, request, getCurrentUserId())));
    }

    @DeleteMapping("/manager/orders/pos/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelPosDraft(
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.cancelPosDraft(orderId, getCurrentUserId())));
    }

    private Long getCurrentUserId() {
        return securityUtils.getCurrentUserId();
    }
}
