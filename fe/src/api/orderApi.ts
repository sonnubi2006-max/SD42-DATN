import axiosInstance, { type PageResponse } from "./axiosInstance";
import type { ReturnResponse } from "./returnApi";

export type OrderStatus =
  | "DRAFT"
  | "WAITING_PAYMENT"
  | "PENDING"
  | "WAITING_STOCK"
  | "CONFIRMED"
  | "SHIPPING"
  | "RETURNING"
  | "RETURNED_TO_SHOP"
  | "CANCELED_BY_DAMAGED"
  | "FAILED_DELIVERY"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type OrderType = "ONLINE" | "POS" | "POS_SHIP";
export type PaymentMethod =
  | "COD"
  | "BANK_TRANSFER"
  | "MOMO"
  | "VNPAY"
  | "CREDIT_CARD";

export interface OrderDetailRequest {
  variantId: number;
  quantity: number;
}

export interface CouponRequest {
  couponId: number | null;
  discountAmount: number | null;
}

export interface OrderAddressRequest {
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  note?: string;
}

export interface CreateOrderRequest {
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  coupon: CouponRequest;
  promotionId?: number | null;
  note?: string;
  items: OrderDetailRequest[];
  isGuest?: boolean;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  orderAddressRequest?: OrderAddressRequest | null;
  shippingFee?: number | null;
}

export interface GuestOrderLookupRequest {
  orderCode: string;
  phone: string;
}

export interface PriceChange {
  variantId: number;
  productName: string;
  color?: string;
  size?: string;
  checkoutPrice?: number;
  discountValue?: string;
  discountType?: string;
  minOrderValue?: number | null;
  currentPrice: number;
  originalPrice: number;
}

export interface CouponChangeChange {
  couponId: number;
  couponCode: string;
  minPrice?: number | null;
  currentPrice: number;
  originalPrice: number;
}

export interface OrderDetailResponse {
  orderDetailId: number;
  productId?: number;
  productCode?: string;
  productSlug?: string;
  variantId?: number;
  variantCode?: string;
  productName: string;
  imageUrl?: string;
  size?: string;
  color?: string;
  quantity: number;
  damagedQuantity?: number;
  undamagedQuantity?: number;
  price: number;
  salePrice?: number;
  purchasedUnitPrice?: number;
  subtotal: number;
  stockQuantity?: number;
  isReviewed?: boolean;
  returnedQuantity?: number;
  remainingReturnQuantity?: number;
}

export interface OrderTransactionLogResponse {
  logId: number;
  previousStatus?: OrderStatus;
  currentStatus: OrderStatus;
  action?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export interface OrderResponse {
  orderId: number;
  orderCode: string;
  userId?: number;
  userName?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  note?: string;
  orderDate?: string;
  createdAt?: string;
  completedAt?: string;
  returnDeadline?: string;
  canReturn?: boolean;
  completedReturnCount?: number;
  completedRefundAmount?: number;
  netRevenue?: number;
  orderDetails: OrderDetailResponse[];
  returnRequests?: ReturnResponse[];
  transactionLogs?: OrderTransactionLogResponse[];
}

export interface OrderSummaryResponse {
  orderId: number;
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  finalAmount: number;
  totalItems: number;
  orderDate?: string;
}

export interface OrderFilterParams {
  keyword?: string;
  status?: OrderStatus | null;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

const orderApi = {
  create: async (payload: CreateOrderRequest): Promise<OrderResponse> => {
    const { data } = await axiosInstance.post<OrderResponse>(
      "/orders",
      payload,
    );
    return data;
  },

  lookupGuest: async (
    payload: GuestOrderLookupRequest,
  ): Promise<OrderResponse> => {
    const { data } = await axiosInstance.post<OrderResponse>(
      "/orders/guest/lookup",
      payload,
    );
    return data;
  },

  getById: async (orderId: number): Promise<OrderResponse> => {
    const { data } = await axiosInstance.get<OrderResponse>(
      `/orders/${orderId}`,
    );
    return data;
  },

  getByCode: async (orderCode: string): Promise<OrderResponse> => {
    const { data } = await axiosInstance.get<OrderResponse>(
      `/orders/code/${orderCode}`,
    );
    return data;
  },

  getMyOrders: async (
    params?: OrderFilterParams,
  ): Promise<PageResponse<OrderSummaryResponse>> => {
    const { data } = await axiosInstance.get<
      PageResponse<OrderSummaryResponse>
    >("/orders/my", {
      params: {
        keyword: params?.keyword || undefined,
        orderStatus: params?.status || undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        sortBy: params?.sortBy ?? "createdAt",
        sortDir: params?.sortDir ?? "desc",
      },
    });
    return data;
  },

  cancel: async (orderId: number, reason?: string): Promise<OrderResponse> => {
    const { data } = await axiosInstance.patch<OrderResponse>(
      `/orders/${orderId}/cancel`,
      null,
      { params: { reason } },
    );
    return data;
  },

  cancelUnpaid: async (
    orderId: number,
    reason?: string,
  ): Promise<OrderResponse> => {
    const { data } = await axiosInstance.patch<OrderResponse>(
      `/orders/${orderId}/cancel-unpaid`,
      null,
      { params: { reason } },
    );
    return data;
  },
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "Chờ thanh toán",
  PENDING: "Chờ xác nhận",
  WAITING_STOCK: "Chờ xác nhận",
  DRAFT: "Chờ thanh toán tại quầy",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  RETURNING: "Đang chuyển hoàn",
  RETURNED_TO_SHOP: "Nhận lại hàng hoàn",
  CANCELED_BY_DAMAGED: "Hủy do hỏng hàng",
  FAILED_DELIVERY: "Giao thất bại",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã huỷ",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  MOMO: "Ví MoMo",
  VNPAY: "VNPay",
  CREDIT_CARD: "Thẻ tín dụng",
};

export default orderApi;
