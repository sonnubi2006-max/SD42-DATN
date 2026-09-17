import axiosInstance from "./axiosInstance";
import type { OrderResponse, PaymentMethod } from "./orderApi";

export type { OrderResponse, PaymentMethod };

export interface PosDraftResponse {
  orderId: number;
  orderCode: string;
  orderType: "ONLINE" | "POS" | "POS_SHIP";
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerId?: number | null;
  status: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  totalItems: number;
  items: PosDraftItem[];
  timeline: any[];
  appliedPromotion?: AppliedPromotion | null;
  couponCode?: string | null;
  couponId?: number | null;
}

export interface AppliedPromotion {
  promotionId: number;
  name: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  applyType: "ORDER" | "PRODUCT" | "CATEGORY";
}

export interface PosDraftItem {
  itemId: number;
  productId: number;
  productName: string;
  variantId: number;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  price: number;       
  salePrice?: number;  
  currentVariantPrice?: number; 
  subtotal: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface CreatePosDraftRequest {
  shiftId?: number;
}

export interface PosAddItemRequest {
  variantId: number;
  quantity: number;
}

export interface PosUpdateItemRequest {
  quantity: number;
}

export interface PosAttachCustomerRequest {
  customerId?: number;
  email?: string;
  fullName?: string;
  phone?: string;
  clear?: boolean;
}

export interface PosCheckoutAddressRequest {
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  note?: string;
}

export interface PosCheckoutRequest {
  paymentMethod: PaymentMethod;
  couponId?: number;
  note?: string;
  delivery?: boolean;
  orderAddressRequest?: PosCheckoutAddressRequest;
  shippingFee?: number;
}

interface BackendOrderDetailResponse {
  orderDetailId: number;
  productId?: number;
  variantId?: number;
  variantCode?: string;
  productName: string;
  imageUrl?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  salePrice?: number | null;
  currentVariantPrice?: number;
  subtotal: number;
  stockQuantity?: number;
}

interface BackendOrderResponse {
  orderId: number;
  orderCode: string;
  orderType: "ONLINE" | "POS" | "POS_SHIP";
  orderStatus: string;
  paymentMethod: PaymentMethod;
  customerId?: number;
  customerName?: string;
  receiverName?: string;
  receiverPhone?: string;
  guestName?: string;
  guestPhone?: string;
  userName?: string;
  couponCode?: string;
  couponId?: number;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  note?: string;
  orderDate?: string;
  createdAt?: string;
  staffId?: number;
  staffName?: string;
  shiftId?: number;
  orderDetails: BackendOrderDetailResponse[];
  transactionLogs?: any[];
}

const mapBackendToDraft = (order: BackendOrderResponse): PosDraftResponse => {
  const customerName =
    order.customerName ||
    order.receiverName ||
    order.guestName ||
    order.userName ||
    "Khách lẻ";
  const customerPhone =
    order.receiverPhone || order.guestPhone || "";

  const items: PosDraftItem[] = (order.orderDetails ?? []).map((d) => ({
    itemId: d.orderDetailId,
    productId: d.productId ?? 0,
    productName: d.productName,
    variantId: d.variantId ?? 0,
    sku: d.variantCode ?? "",
    color: d.color ?? "",
    size: d.size ?? "",
    quantity: d.quantity,
    price: d.price,
    salePrice: d.salePrice ?? undefined,
    currentVariantPrice: d.currentVariantPrice ?? (d.salePrice ?? d.price),
    subtotal: d.subtotal,
    stockQuantity: d.stockQuantity ?? 999, 
    imageUrl: d.imageUrl,
  }));

  return {
    orderId: order.orderId,
    orderCode: order.orderCode,
    orderType: order.orderType,
    customerId: order.customerId ?? null,
    customerName,
    customerPhone,
    customerEmail: "",
    status: order.orderStatus,
    paymentMethod: order.paymentMethod ?? "CASH",
    paymentStatus: order.orderStatus === "DRAFT" ? "UNPAID" : "PAID",
    subtotal: order.totalAmount ?? 0,
    discountAmount: order.discountAmount ?? 0,
    totalAmount: order.finalAmount ?? order.totalAmount ?? 0,
    note: order.note ?? null,
    createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
    updatedAt: order.createdAt || order.orderDate || new Date().toISOString(),
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    items,
    timeline: order.transactionLogs ?? [],
    couponCode: order.couponCode ?? null,
    couponId: order.couponId ?? null,
  };
};

const POS_BASE = "/manager/orders";

export const posApi = {

  createDraft: (request: CreatePosDraftRequest) =>
    axiosInstance
      .post<BackendOrderResponse>(`${POS_BASE}/pos/draft`, null, {
        params: { shiftId: request.shiftId },
      })
      .then((res) => mapBackendToDraft(res.data)),

  getDrafts: () =>
    axiosInstance
      .get<BackendOrderResponse[]>(`${POS_BASE}/pos/drafts`)
      .then((res) => res.data.map(mapBackendToDraft)),

  getDraftById: (orderId: number) =>
    axiosInstance
      .get<BackendOrderResponse>(`${POS_BASE}/${orderId}`)
      .then((res) => mapBackendToDraft(res.data)),

  cancelDraft: (orderId: number) =>
    axiosInstance
      .delete<BackendOrderResponse>(`${POS_BASE}/pos/${orderId}`)
      .then((res) => mapBackendToDraft(res.data)),

  addItem: (orderId: number, request: PosAddItemRequest) =>
    axiosInstance
      .post<BackendOrderResponse>(`${POS_BASE}/pos/${orderId}/items`, request)
      .then((res) => mapBackendToDraft(res.data)),

  updateItem: (
    orderId: number,
    detailId: number,
    request: PosUpdateItemRequest,
  ) =>
    axiosInstance
      .patch<BackendOrderResponse>(
        `${POS_BASE}/pos/${orderId}/items/${detailId}`,
        request,
      )
      .then((res) => mapBackendToDraft(res.data)),

  removeItem: (orderId: number, detailId: number) =>
    axiosInstance
      .delete<BackendOrderResponse>(`${POS_BASE}/pos/${orderId}/items/${detailId}`)
      .then((res) => mapBackendToDraft(res.data)),

  attachCustomer: (orderId: number, request: PosAttachCustomerRequest) =>
    axiosInstance
      .patch<BackendOrderResponse>(`${POS_BASE}/pos/${orderId}/customer`, request)
      .then((res) => mapBackendToDraft(res.data)),

  checkout: (orderId: number, request: PosCheckoutRequest) =>
    axiosInstance
      .post<BackendOrderResponse>(`${POS_BASE}/pos/${orderId}/checkout`, request)
      .then((res) => mapBackendToDraft(res.data)),

  getActivePromotions: () =>
    axiosInstance.get<any[]>("/promotions/active").then((res) => res.data),

  calculateShippingFee: (params: { toDistrictId: number; toWardCode: string; weight?: number }) =>
    axiosInstance.get<number>("/shipping/ghn/fee", { params }).then((res) => res.data),
};
