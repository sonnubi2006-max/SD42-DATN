import axiosInstance from "./axiosInstance";
import type { PageResponse } from "./inventoryApi";
import { returnApi, type ReturnResponse } from "./returnApi";

export type OrderStatus =
  | "DRAFT"
  | "WAITING_PAYMENT"
  | "PENDING"
  | "WAITING_STOCK"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPING"
  | "RETURNING"
  | "RETURNED_TO_SHOP"
  | "CANCELED_BY_DAMAGED"
  | "FAILED_DELIVERY"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export const ORDER_EVIDENCE_REQUIRED_STATUSES: OrderStatus[] = [
  "FAILED_DELIVERY",
  "RETURNING",
  "CANCELED_BY_DAMAGED",
];

export const orderStatusRequiresEvidence = (status: OrderStatus): boolean =>
  ORDER_EVIDENCE_REQUIRED_STATUSES.includes(status);

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Đơn nháp tại quầy",
  WAITING_PAYMENT: "Chờ thanh toán",
  PENDING: "Chờ xác nhận",
  WAITING_STOCK: "Chờ bổ sung hàng",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao hàng",
  RETURNING: "Đang hoàn hàng",
  RETURNED_TO_SHOP: "Đã nhận hàng hoàn",
  CANCELED_BY_DAMAGED: "Hủy do hàng hỏng",
  FAILED_DELIVERY: "Giao hàng thất bại",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

// Các trạng thái dùng trong bộ lọc quản lý hóa đơn. DRAFT (đơn chờ tại quầy)
// và WAITING_PAYMENT thuộc luồng POS/thanh toán nên không hiển thị thành tab.
export const ORDER_MANAGEMENT_STATUSES = [
  "PENDING",
  "WAITING_STOCK",
  "CONFIRMED",
  "SHIPPING",
  "RETURNING",
  "RETURNED_TO_SHOP",
  "CANCELED_BY_DAMAGED",
  "FAILED_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type PaymentMethod = "CASH" | "COD" | "VNPAY" | "MOMO" | "BANK_TRANSFER";

export interface OrderItemResponse {
  itemId: number;
  productId: number;
  productCode?: string;
  productSlug?: string;
  productName: string;
  variantId: number;
  variantCode: string;
  color: string;
  size: string;
  quantity: number;
  damagedQuantity: number;
  undamagedQuantity: number;
  price: number;
  salePrice?: number;
  subtotal: number;
  stockQuantity?: number;
  imageUrl?: string;
  returnedQuantity?: number;
  remainingReturnQuantity?: number;
}

export interface OrderResponse {
  orderId: number;
  customerId?: number;
  customerSource?: "GUEST" | "REGISTERED";
  orderType: "ONLINE" | "POS" | "POS_SHIP";
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  customerAddress: string;
  shippingAddress?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  returnDeadline?: string;
  canReturn?: boolean;
  totalItems: number;
  shiftId?: number;
  staffName?: string;
  couponCode?: string;
  finalAmount: number;
  completedReturnCount: number;
  completedRefundAmount: number;
  netRevenue: number;
  returnRequests: ReturnResponse[];
  items: OrderItemResponse[];
  timeline: OrderTimelineResponse[];
  transactionLogs?: BackendOrderTransactionLogResponse[];
}

export interface OrderTimelineResponse {
  timelineId: number;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface OrderSearchParams {
  keyword?: string;
  status?: OrderStatus;
  orderType?: "ONLINE" | "POS" | "POS_SHIP";
  paymentMethod?: PaymentMethod;
  fromDate?: string;
  toDate?: string;
  dateBasis?: "CREATED" | "COMPLETED";
  shiftId?: number;
  customerId?: number;
  staffId?: number;
  page?: number;
  size?: number;
}

export interface PosOrderItemRequest {
  productId: number;
  variantId: number;
  productName: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

export interface CreatePosOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  couponId?: number;
  shiftId?: number;
  discountAmount: number;
  subtotal: number;
  totalAmount: number;
  note?: string;
  items: PosOrderItemRequest[];
}

interface BackendOrderDetailResponse {
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
  subtotal: number;
  stockQuantity?: number;
  currentVariantPrice?: number;
  isReviewed?: boolean;
  returnedQuantity?: number;
  remainingReturnQuantity?: number;
}

export interface OrderTransactionLogImageResponse {
  imageId: number;
  imageUrl: string;
  originalName?: string;
  contentType?: string;
  fileSize?: number;
  createdAt: string;
}

interface BackendOrderTransactionLogResponse {
  logId: number;
  previousStatus?: OrderStatus;
  currentStatus: OrderStatus;
  action?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
  images?: OrderTransactionLogImageResponse[];
}

interface BackendOrderResponse {
  orderId: number;
  orderCode: string;
  userName?: string;

  customerId?: number;
  customerSource?: "GUEST" | "REGISTERED";
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  orderType: "ONLINE" | "POS" | "POS_SHIP";
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  note?: string;
  createdAt?: string;
  orderDate?: string;
  completedAt?: string;
  returnDeadline?: string;
  canReturn?: boolean;
  staffName?: string;
  shiftId?: number;
  orderDetails: BackendOrderDetailResponse[];
  transactionLogs?: BackendOrderTransactionLogResponse[];
  completedReturnCount?: number;
  completedRefundAmount?: number;
  netRevenue?: number;
  returnRequests?: ReturnResponse[];
}

interface BackendOrderSummaryResponse {
  orderId: number;
  orderCode: string;
  customerName?: string;
  customerPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  orderType: "ONLINE" | "POS" | "POS_SHIP";
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmount?: number;
  discountAmount?: number;
  shippingFee?: number;
  finalAmount: number;
  totalItems: number;
  orderDate?: string;
  completedAt?: string;
}

interface BackendPageResponse<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

const derivePaymentStatus = (
  orderStatus: OrderStatus,
  paymentMethod: PaymentMethod,
): PaymentStatus =>
  orderStatus === "REFUNDED"
    ? "REFUNDED"
    : orderStatus === "WAITING_PAYMENT" || orderStatus === "CANCELLED"
      ? "UNPAID"
      : paymentMethod === "COD" && orderStatus !== "COMPLETED"
        ? "UNPAID"
        : "PAID";

const mapSummary = (order: BackendOrderSummaryResponse): OrderResponse => ({
  orderId: order.orderId,
  orderCode: order.orderCode,
  orderType: order.orderType,

  customerName: order.customerName || "Khách vãng lai",
  customerPhone: order.customerPhone || "",
  receiverName: order.receiverName ?? "",
  receiverPhone: order.receiverPhone ?? "",
  receiverAddress: "",
  customerAddress: "",
  customerEmail: "",
  shippingAddress:
    order.orderType === "POS"
      ? "Mua trực tiếp tại quầy"
      : order.orderType === "POS_SHIP"
        ? "Bán tại quầy giao hàng"
        : "",
  paymentMethod: order.paymentMethod,
  paymentStatus: derivePaymentStatus(order.orderStatus, order.paymentMethod),
  status: order.orderStatus,
  subtotal:
    order.totalAmount ??
    (order.finalAmount
      ? Math.max(
        0,
        order.finalAmount -
        (order.shippingFee ?? 0) +
        (order.discountAmount ?? 0),
      )
      : 0),
  discountAmount: order.discountAmount ?? 0,
  shippingFee: order.shippingFee ?? 0,
  totalAmount: order.finalAmount ?? order.totalAmount ?? 0,
  finalAmount: order.finalAmount ?? order.totalAmount ?? 0,
  note: null,
  createdAt: order.orderDate || new Date().toISOString(),
  updatedAt: order.orderDate || new Date().toISOString(),
  completedAt: order.completedAt,
  totalItems: order.totalItems,
  completedReturnCount: 0,
  completedRefundAmount: 0,
  netRevenue: Math.max(
    0,
    (order.finalAmount ?? order.totalAmount ?? 0) - (order.shippingFee ?? 0),
  ),
  returnRequests: [],
  items: [],
  timeline: [
    {
      timelineId: order.orderId,
      status: order.orderStatus,
      description: "Trạng thái hiện tại của đơn hàng",
      createdAt: order.orderDate || new Date().toISOString(),
      createdBy: "Hệ thống",
    },
  ],
});

const mapOrder = (order: BackendOrderResponse): OrderResponse => {
  const customerName =
    order.customerName || order.guestName || "Khách vãng lai";
  const customerPhone = order.customerPhone || order.guestPhone || "";

  return {
    orderId: order.orderId,
    customerId: order.customerId,
    customerSource: order.customerSource,
    orderCode: order.orderCode,
    orderType: order.orderType,
    customerName,
    customerPhone,
    customerAddress: order.customerAddress ?? "",
    receiverName: order.receiverName ?? "",
    receiverPhone: order.receiverPhone ?? "",
    receiverAddress: order.receiverAddress ?? "",
    customerEmail: order.customerEmail || order.guestEmail || "",
    shippingAddress:
      order.receiverAddress ||
      order.customerAddress ||
      (order.orderType === "POS" ? "Mua trực tiếp tại quầy" : ""),
    paymentMethod: order.paymentMethod,
    paymentStatus: derivePaymentStatus(order.orderStatus, order.paymentMethod),
    status: order.orderStatus,
    subtotal: order.totalAmount ?? 0,
    discountAmount: order.discountAmount ?? 0,
    shippingFee: order.shippingFee ?? 0,
    totalAmount: order.finalAmount ?? order.totalAmount ?? 0,
    finalAmount: order.finalAmount ?? order.totalAmount ?? 0,
    note: order.note ?? null,
    createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
    updatedAt: order.createdAt || order.orderDate || new Date().toISOString(),
    completedAt: order.completedAt,
    returnDeadline: order.returnDeadline,
    canReturn: order.canReturn,
    shiftId: order.shiftId,
    staffName: order.staffName,
    couponCode: order.couponCode,
    completedReturnCount: order.completedReturnCount ?? 0,
    completedRefundAmount: order.completedRefundAmount ?? 0,
    netRevenue:
      order.netRevenue ??
      Math.max(
        0,
        (order.finalAmount ?? order.totalAmount ?? 0) -
        (order.shippingFee ?? 0) -
        (order.completedRefundAmount ?? 0),
      ),
    returnRequests: order.returnRequests ?? [],
    totalItems: (order.orderDetails ?? []).reduce(
      (sum, item) => sum + item.quantity,
      0,
    ),
    items: (order.orderDetails ?? []).map((item) => ({
      itemId: item.orderDetailId,
      productId: item.productId ?? 0,
      productCode: item.productCode,
      productSlug: item.productSlug,
      productName: item.productName,
      variantId: item.variantId ?? 0,
      variantCode: item.variantCode ?? "",
      color: item.color ?? "",
      size: item.size ?? "",
      quantity: item.quantity,
      damagedQuantity: item.damagedQuantity ?? 0,
      undamagedQuantity:
        item.undamagedQuantity ??
        Math.max(0, item.quantity - (item.damagedQuantity ?? 0)),
      price: item.price,
      salePrice: item.salePrice,
      subtotal: item.subtotal,
      stockQuantity: item.stockQuantity,
      imageUrl: item.imageUrl,
      returnedQuantity: item.returnedQuantity ?? 0,
      remainingReturnQuantity:
        item.remainingReturnQuantity ?? item.quantity,
    })),
    timeline:
      order.transactionLogs && order.transactionLogs.length > 0
        ? order.transactionLogs.map((log) => ({
          timelineId: log.logId,
          status: log.currentStatus,
          previousStatus: log.previousStatus,
          description: log.action + (log.note ? ` - ${log.note}` : ""),
          createdAt: log.createdAt,
          createdBy: log.createdBy || "Hệ thống",
        }))
        : [
          {
            timelineId: order.orderId,
            status: order.orderStatus,
            description: order.note || "Trạng thái hiện tại của đơn hàng",
            createdAt:
              order.createdAt || order.orderDate || new Date().toISOString(),
            createdBy: order.staffName || "Hệ thống",
          },
        ],
    transactionLogs: order.transactionLogs || [],
  };
};

export const orderNeedsStockReplenishment = (
  order: Pick<OrderResponse, "items">,
): boolean => {
  const requestedByVariant = new Map<number, number>();
  const stockByVariant = new Map<number, number>();

  order.items.forEach((item) => {
    requestedByVariant.set(
      item.variantId,
      (requestedByVariant.get(item.variantId) ?? 0) + item.quantity,
    );
    if (item.stockQuantity !== undefined) {
      stockByVariant.set(item.variantId, item.stockQuantity);
    }
  });

  return [...requestedByVariant].some(([variantId, requestedQuantity]) => {
    const stockQuantity = stockByVariant.get(variantId);
    return stockQuantity !== undefined && stockQuantity < requestedQuantity;
  });
};

const ADMIN_BASE = "/manager/orders";

export interface TopRatedProductStatistic {
  productId: number;
  productName: string;
  averageRating: number;
  reviewCount: number;
}

export const orderApi = {
  getAll: async (
    params: OrderSearchParams,
  ): Promise<PageResponse<OrderResponse>> => {
    const { data } = await axiosInstance.get<
      BackendPageResponse<BackendOrderSummaryResponse>
    >(ADMIN_BASE, {
      params: {
        keyword: params.keyword || undefined,
        orderStatus: params.status || undefined,
        orderType: params.orderType || undefined,
        paymentMethod: params.paymentMethod || undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
        dateBasis: params.dateBasis || "CREATED",
        shiftId: params.shiftId || undefined,
        userId: params.customerId || undefined,
        staffId: params.staffId || undefined,
        page: params.page ?? 0,
        size: params.size ?? 10,
        sortBy: params.dateBasis === "COMPLETED" ? "completedAt" : "createdAt",
        sortDir: "desc",
      },
    });
    return {
      ...data,
      content: data.content.map(mapSummary),
    };
  },

  getById: async (id: number): Promise<OrderResponse> => {
    const { data } = await axiosInstance.get<BackendOrderResponse>(
      `${ADMIN_BASE}/${id}`,
    );
    return mapOrder(data);
  },

  getTopRatedProductStatistics: async (
    params?: { fromDate?: string; toDate?: string },
    limit = 5,
  ): Promise<TopRatedProductStatistic[]> => {
    const { data } = await axiosInstance.get<TopRatedProductStatistic[]>(
      `${ADMIN_BASE}/top-rated-product-statistics`,
      {
        params: {
          fromDate: params?.fromDate,
          toDate: params?.toDate,
          limit,
        },
      },
    );
    return data;
  },

  getReturnEligible: async (): Promise<OrderResponse[]> => {
    const summaries = await orderApi.getAll({
      status: "COMPLETED",
      page: 0,
      size: 100,
    });
    const eligibleOrders: OrderResponse[] = [];

    // Chi tiết đơn chứa hạn trả và số lượng còn có thể trả. Chia nhỏ để
    // không gửi quá nhiều request đồng thời khi danh sách đơn lớn.
    for (let index = 0; index < summaries.content.length; index += 10) {
      const batch = summaries.content.slice(index, index + 10);
      const details = await Promise.allSettled(
        batch.map((order) => orderApi.getById(order.orderId)),
      );

      details.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.canReturn === true
        ) {
          eligibleOrders.push(result.value);
        }
      });
    }

    return eligibleOrders.sort(
      (first, second) =>
        new Date(second.completedAt ?? second.updatedAt).getTime() -
        new Date(first.completedAt ?? first.updatedAt).getTime(),
    );
  },

  updateStatus: async (
    id: number,
    payload: {
      status: OrderStatus;
      note?: string;
      damagedItems?: { variantId: number; damagedQuantity: number }[];
      images?: File[];
    },
  ): Promise<OrderResponse> => {
    const formData = new FormData();
    formData.append(
      "request",
      new Blob(
        [
          JSON.stringify({
            orderStatus: payload.status,
            note: payload.note,
            damagedItems: payload.damagedItems,
          }),
        ],
        { type: "application/json" },
      ),
    );
    payload.images?.forEach((image) => formData.append("images", image));

    const { data } = await axiosInstance.put<BackendOrderResponse>(
      `${ADMIN_BASE}/${id}/status`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return mapOrder(data);
  },

  createPosOrder: async (
    request: CreatePosOrderRequest,
  ): Promise<OrderResponse> => {
    const { data } = await axiosInstance.post<BackendOrderResponse>(
      `/manager/orders/pos`,
      {
        receiverName: request.customerName || "Khách lẻ",
        receiverPhone: request.customerPhone || "0900000000",
        orderType: "POS",
        paymentMethod: request.paymentMethod,
        couponId: request.couponId,
        shiftId: request.shiftId,
        note: request.note,
        items: request.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      },
    );
    return mapOrder(data);
  },
  bulkUpdateStatus: async (params: {
    orderIds: number[];
    status: OrderStatus;
    note?: string;
  }): Promise<{
    successCount: number;
    failedCount: number;
    updatedOrderIds: number[];
    errorMessages: string[];
  }> => {
    try {
      const { data } = await axiosInstance.put<{
        successCount: number;
        failedCount: number;
        updatedOrderIds: number[];
        errorMessages: string[];
      }>(
        "/manager/orders/bulk-status",
        {
          orderIds: params.orderIds,
          orderStatus: params.status,
          note: params.note,
        },
      );
      return data;
    } catch {
      let successCount = 0;
      let failedCount = 0;
      const updatedOrderIds: number[] = [];
      const errorMessages: string[] = [];

      for (const id of params.orderIds) {
        try {
          await orderApi.updateStatus(id, {
            status: params.status,
            note: params.note,
          });
          successCount++;
          updatedOrderIds.push(id);
        } catch (e: unknown) {
          failedCount++;
          const message = e instanceof Error ? e.message : "Lỗi";
          errorMessages.push(`Đơn #${id}: ${message}`);
        }
      }

      return {
        successCount,
        failedCount,
        updatedOrderIds,
        errorMessages,
      };
    }
  },

  getStatistics: async (params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    totalOrders: number;
    totalItemsSold: number;
    pendingCount: number;
    confirmedCount: number;
    shippingCount: number;
    deliveredCount: number;
    cancelledCount: number;
    returnedCount: number;
    completedReturnCount: number;
    totalRefundAmount: number;
    grossRevenue: number;
    totalRevenue: number;
    cashRevenue: number;
    transferRevenue: number;
    dailyRevenue: {
      date: string;
      revenue: number;
      cashRevenue: number;
      transferRevenue: number;
      refundAmount: number;
    }[];
    bestSellingSizes: { size: string; count: number }[];
    bestSellingColors: { color: string; count: number }[];
    topProducts: { productId: number; productName: string; quantity: number; revenue: number }[];
    slowProducts: { productId: number; productName: string; quantity: number; revenue: number }[];
    topCustomers: {
      name: string;
      phone: string;
      orderCount: number;
      totalSpent: number;
    }[];
    orderTypeStats: {
      posRevenue: number;
      onlineRevenue: number;
      posCount: number;
      onlineCount: number;
    };
    topCoupons: {
      code: string;
      orderCount: number;
      discountAmount: number;
      revenue: number;
    }[];
    topPromotions: {
      name: string;
      orderCount: number;
      discountAmount: number;
      revenue: number;
    }[];
    topStaff: {
      staffId: number;
      staffName: string;
      orderCount: number;
      revenue: number;
    }[];
  }> => {
    const getAllStatisticsOrders = async (extra?: {
      dateBasis?: "CREATED" | "COMPLETED";
    }) => {
      const commonParams = {
        size: 1000,
        fromDate: params?.fromDate,
        toDate: params?.toDate,
        dateBasis: extra?.dateBasis,
      };
      const firstPage = await orderApi.getAll({ ...commonParams, page: 0 });
      if (firstPage.totalPages <= 1) return firstPage;

      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
          orderApi.getAll({ ...commonParams, page: index + 1 }),
        ),
      );
      return {
        ...firstPage,
        content: [
          ...firstPage.content,
          ...remainingPages.flatMap((pageResult) => pageResult.content),
        ],
      };
    };

    const [page, revenuePage, returnStats, productSales, staffSales] = await Promise.all([
      getAllStatisticsOrders({ dateBasis: "CREATED" }),
      getAllStatisticsOrders({ dateBasis: "COMPLETED" }),
      returnApi.getStatistics(params),
      axiosInstance
        .get<{ productId: number; productName: string; quantity: number; revenue: number }[]>(
          `${ADMIN_BASE}/product-sales-statistics`,
          { params },
        )
        .then((response) => response.data),
      axiosInstance
        .get<{ staffId: number; staffName: string; orderCount: number; revenue: number }[]>(
          `${ADMIN_BASE}/staff-sales-statistics`,
          { params },
        )
        .then((response) => response.data),
    ]);
    const orders = page.content;
    const revenueOrders = revenuePage.content;

    const totalItemsSold = revenueOrders
      .filter((o) => o.status === "COMPLETED" || o.status === "REFUNDED" || o.status === "CANCELED_BY_DAMAGED")
      .reduce((sum, o) => sum + (o.totalItems ?? 0), 0);

    const pendingCount = orders.filter(
      (o) => o.status === "PENDING" || o.status === "WAITING_PAYMENT",
    ).length;
    const confirmedCount = orders.filter(
      (o) => o.status === "CONFIRMED",
    ).length;
    const shippingCount = orders.filter((o) => o.status === "SHIPPING").length;
    const deliveredCount = revenueOrders.filter(
      (o) => o.status === "COMPLETED",
    ).length;
    const cancelledCount = orders.filter(
      (o) => o.status === "CANCELLED" || o.status === "CANCELED_BY_DAMAGED",
    ).length;
    const returnedCount = returnStats.returnedOrderCount;

    const getOrderNetRevenue = (o: OrderResponse) => {
      const finalPay = o.finalAmount ?? o.totalAmount ?? 0;
      return Math.max(0, finalPay - (o.shippingFee ?? 0));
    };
    const isRevenueOrder = (order: OrderResponse) =>
      order.status === "COMPLETED" ||
      order.status === "REFUNDED" ||
      order.status === "CANCELED_BY_DAMAGED";

    const grossRevenue = revenueOrders
      .filter(isRevenueOrder)
      .reduce((sum, o) => sum + getOrderNetRevenue(o), 0);

    const dailyRevenueMap: {
      [key: string]: {
        revenue: number;
        cashRevenue: number;
        transferRevenue: number;
        refundAmount: number;
      };
    } = {};
    const dateList: string[] = [];

    let start = params?.fromDate ? new Date(params.fromDate) : null;
    let end = params?.toDate ? new Date(params.toDate) : null;

    if (!start || !end) {
      start = new Date();
      start.setDate(start.getDate() - 6);
      end = new Date();
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toLocaleDateString("en-US");
      dailyRevenueMap[dateStr] = {
        revenue: 0,
        cashRevenue: 0,
        transferRevenue: 0,
        refundAmount: 0,
      };
      dateList.push(dateStr);
      current.setDate(current.getDate() + 1);
      if (dateList.length > 366) break;
    }

    revenueOrders.forEach((o) => {
      if (isRevenueOrder(o)) {
        const orderDate = new Date(o.completedAt ?? o.updatedAt).toLocaleDateString("en-US");
        if (dailyRevenueMap[orderDate] !== undefined) {
          const revenue = getOrderNetRevenue(o);
          const isCashPayment =
            o.paymentMethod === "CASH" || o.paymentMethod === "COD";

          dailyRevenueMap[orderDate].revenue += revenue;
          if (isCashPayment) {
            dailyRevenueMap[orderDate].cashRevenue += revenue;
          } else {
            dailyRevenueMap[orderDate].transferRevenue += revenue;
          }
        }
      }
    });

    returnStats.dailyRefunds.forEach((refund) => {
      const refundDate = new Date(`${refund.date}T00:00:00`).toLocaleDateString("en-US");
      const daily = dailyRevenueMap[refundDate];
      if (!daily) return;

      const refundAmount = refund.refundAmount ?? 0;
      // Tiền đổi hàng chỉ dùng để đối soát/hiển thị riêng, không làm giảm doanh thu.
      daily.refundAmount += refundAmount;
    });

    const dailyRevenue = dateList.map((dateStr) => {
      const dateObj = new Date(dateStr);
      const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      return {
        date: label,
        ...dailyRevenueMap[dateStr],
      };
    });

    const cashRevenue = dailyRevenue.reduce(
      (sum, item) => sum + item.cashRevenue,
      0,
    );
    const transferRevenue = dailyRevenue.reduce(
      (sum, item) => sum + item.transferRevenue,
      0,
    );
    const totalRevenue = cashRevenue + transferRevenue;

    let posRevenue = 0;
    let onlineRevenue = 0;
    let posCount = 0;
    let onlineCount = 0;
    revenueOrders.forEach((o) => {
      const isRevenue = isRevenueOrder(o);
      const netRev = getOrderNetRevenue(o);
      if (o.orderType === "POS" || o.orderType === "POS_SHIP") {
        posCount++;
        if (isRevenue) posRevenue += netRev;
      } else {
        onlineCount++;
        if (isRevenue) onlineRevenue += netRev;
      }
    });

    const bestSellingSizes: { size: string; count: number }[] = [];
    const bestSellingColors: { color: string; count: number }[] = [];
    const topProducts = productSales.filter((item) => item.quantity > 0).slice(0, 5);
    const slowProducts = [...productSales]
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 5);

    const customerMap: {
      [phone: string]: {
        name: string;
        phone: string;
        orderCount: number;
        totalSpent: number;
      };
    } = {};

    revenueOrders.forEach((o) => {
      if (isRevenueOrder(o)) {
        const phone = o.customerPhone ? o.customerPhone.trim() : "";
        const name = o.customerName ? o.customerName.trim() : "";

        if (!phone && !name) return;
        if (
          name.toLowerCase() === "khách lẻ" ||
          name.toLowerCase() === "khách vãng lai"
        )
          return;

        const key = phone || name;
        if (!customerMap[key]) {
          customerMap[key] = {
            name: name || "Khách hàng",
            phone: phone || "Không có SĐT",
            orderCount: 0,
            totalSpent: 0,
          };
        }
        customerMap[key].orderCount += 1;
        customerMap[key].totalSpent += getOrderNetRevenue(o);
      }
    });

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const couponMap: {
      [code: string]: {
        code: string;
        orderCount: number;
        discountAmount: number;
        revenue: number;
      };
    } = {};
    revenueOrders.forEach((o) => {
      if (
        isRevenueOrder(o) &&
        o.couponCode
      ) {
        const code = o.couponCode.trim().toUpperCase();
        if (!couponMap[code]) {
          couponMap[code] = {
            code,
            orderCount: 0,
            discountAmount: 0,
            revenue: 0,
          };
        }
        couponMap[code].orderCount += 1;
        couponMap[code].discountAmount += o.discountAmount ?? 0;
        couponMap[code].revenue += getOrderNetRevenue(o);
      }
    });
    const topCoupons = Object.values(couponMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topPromotions: {
      name: string;
      orderCount: number;
      discountAmount: number;
      revenue: number;
    }[] = [];

    return {
      totalOrders: page.totalElements,
      totalItemsSold,
      pendingCount,
      confirmedCount,
      shippingCount,
      deliveredCount,
      cancelledCount,
      returnedCount,
      completedReturnCount: returnStats.completedReturnCount,
      totalRefundAmount: returnStats.totalRefundAmount,
      grossRevenue,
      totalRevenue,
      cashRevenue,
      transferRevenue,
      dailyRevenue,
      bestSellingSizes,
      bestSellingColors,
      topProducts,
      slowProducts,
      topCustomers,
      orderTypeStats: {
        posRevenue,
        onlineRevenue,
        posCount,
        onlineCount,
      },
      topCoupons,
      topPromotions,
      topStaff: [...staffSales]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  },
};
