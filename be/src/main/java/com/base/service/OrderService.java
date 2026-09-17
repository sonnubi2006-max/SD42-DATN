package com.base.service;

import com.base.dto.request.order.*;
import com.base.dto.response.order.OrderResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.dto.response.order.ProductSalesStatisticResponse;
import com.base.dto.response.order.StaffSalesStatisticResponse;
import com.base.dto.response.order.TopRatedProductStatisticResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.time.LocalDateTime;

public interface OrderService {

    OrderResponse createOnlineOrder(CreateOrderOnlineRequest request, Long userId);
    OrderResponse lookupGuestOrder(GuestOrderLookupRequest request);
    OrderResponse getOrderById(Long orderId, Long userId);
    OrderResponse getOrderByCode(String orderCode, Long userId);
    Page<OrderSummaryResponse> getMyOrders(Long userId, OrderFilterRequest filter);
    OrderResponse cancelOrderByUser(Long orderId, Long userId, String reason);

    OrderResponse createPosOrder(CreateOrderRequest request, Long staffId);
    OrderResponse cancelUnpaidPaymentOrder(Long orderId, String reason);

    OrderResponse createPosDraft(Long staffId, Long shiftId);
    List<OrderResponse> getPosDrafts(Long staffId);
    OrderResponse addPosItem(Long orderId, PosAddItemRequest request, Long staffId);
    OrderResponse updatePosItem(Long orderId, Long detailId, PosUpdateItemRequest request, Long staffId);
    OrderResponse removePosItem(Long orderId, Long detailId, Long staffId);
    OrderResponse attachPosCustomer(Long orderId, PosAttachCustomerRequest request, Long staffId);
    OrderResponse checkoutPosOrder(Long orderId, PosCheckoutRequest request, Long staffId);
    OrderResponse cancelPosDraft(Long orderId, Long staffId);
    OrderResponse cancelUnpaidPaymentOrder(Long orderId, Long userId, String reason);

    OrderResponse adminGetOrderById(Long orderId);
    Page<OrderSummaryResponse> adminFilterOrders(OrderFilterRequest filter);
    List<ProductSalesStatisticResponse> getProductSalesStatistics(LocalDateTime fromDate, LocalDateTime toDate);
    List<StaffSalesStatisticResponse> getStaffSalesStatistics(LocalDateTime fromDate, LocalDateTime toDate);
    List<TopRatedProductStatisticResponse> getTopRatedProductStatistics(
            LocalDateTime fromDate, LocalDateTime toDate, int limit);
    OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, Long staffId);
    OrderResponse updateOrderStatus(
            Long orderId,
            UpdateOrderStatusRequest request,
            Long staffId,
            List<MultipartFile> images
    );
    void updateOrderStatusInNewTransaction(Long orderId, UpdateOrderStatusRequest request, Long staffId);
    com.base.dto.response.order.BulkUpdateOrderStatusResponse bulkUpdateOrderStatus(com.base.dto.request.order.BulkUpdateOrderStatusRequest request, Long staffId);
    OrderResponse confirmPaidOnlineOrder(Long orderId);
}
