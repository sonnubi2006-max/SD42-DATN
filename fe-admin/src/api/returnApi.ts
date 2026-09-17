import axiosInstance, { type PageResponse } from "./axiosInstance";

const DEFAULT_UPLOAD_CONCURRENCY = 3;

const uploadReturnImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axiosInstance.post<string>(
    "/manager/returns/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
};

const uploadReturnImages = async (
  files: File[],
  concurrency = DEFAULT_UPLOAD_CONCURRENCY,
): Promise<string[]> => {
  if (files.length === 0) return [];

  const workerCount = Math.min(
    files.length,
    Math.max(1, Math.floor(concurrency)),
  );
  const uploadedUrls = new Array<string>(files.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < files.length) {
      const currentIndex = nextIndex++;
      uploadedUrls[currentIndex] = await uploadReturnImage(files[currentIndex]);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return uploadedUrls;
};

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
export type ReturnType = "REFUND" | "EXCHANGE";
export type ExchangeFulfillmentMethod = "STORE_PICKUP" | "DELIVERY";
export type ExchangeDeliveryStatus = "PREPARING" | "SHIPPING" | "DELIVERED" | "FAILED_DELIVERY"
  | "RETURNING" | "RETURNED_TO_SHOP" | "CANCELLED" | "CANCELED_BY_DAMAGED" | "FAILED";

export interface ExchangeDeliverySummary {
  exchangeDeliveryId: number;
  deliveryCode: string;
  fulfillmentMethod: ExchangeFulfillmentMethod;
  status: ExchangeDeliveryStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  updatedAt: string | null;
}

export interface ReturnItemResponse {
  returnItemId: number;
  productId: number;
  productCode?: string;
  productSlug?: string;
  productName: string;
  variantId: number;
  sku: string;
  imageUrl?: string;
  color: string;
  size: string;
  quantity: number;
  damagedQuantity?: number;
  originalPrice: number;
  refundPrice: number;
  reason: string;
}

export interface ExchangeItemResponse {
  exchangeItemId: number;
  sourceVariantId?: number;
  sourceProductName?: string;
  sourceColor?: string;
  sourceSize?: string;
  variantId: number;
  productId?: number;
  productCode?: string;
  productSlug?: string;
  productName: string;
  variantCode?: string;
  imageUrl?: string;
  color: string;
  size: string;
  quantity: number;
  priceDifference: number;
}

export interface ReturnResponse {
  returnId: number;
  orderId: number;
  customerId: number | null;
  customerCode: string | null;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  refundAmount: number;
  status: ReturnStatus;
  returnType: ReturnType;
  exchangeFulfillmentMethod: ExchangeFulfillmentMethod;
  exchangeReceiverName: string | null;
  exchangeReceiverPhone: string | null;
  exchangeDeliveryAddress: string | null;
  exchangeShippingFee: number;
  note: string | null;
  rejectReason: string | null;
  images: string | null;
  processedImages: string | null;
  processedById: number | null;
  processedByName: string | null;
  createdAt: string;
  updatedAt: string;
  items: ReturnItemResponse[];
  exchangeItems: ExchangeItemResponse[];
  exchangeDelivery: ExchangeDeliverySummary | null;
}

export interface CreateReturnRequest {
  orderId: number;
  customerName: string;
  customerPhone: string;
  returnType: ReturnType;
  note?: string;
  images?: string;
  items: {
    variantId: number;
    quantity: number;
    reason: string;
  }[];
  exchangeItems?: {
    sourceVariantId: number;
    newVariantId: number;
    newQuantity: number;
  }[];
  exchangeFulfillmentMethod?: ExchangeFulfillmentMethod;
  exchangeShippingFee?: number;
  exchangeDeliveryAddress?: {
    receiverName: string;
    receiverPhone: string;
    province: string;
    district: string;
    ward: string;
    detailAddress: string;
  };
}

export interface CompleteReturnRequest {
  items?: {
    returnItemId: number;
    damagedQuantity: number;
  }[];
  processedImages?: string;
}

export interface ReturnFilterParams {
  status?: ReturnStatus;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ReturnStatisticsResponse {
  returnedOrderCount: number;
  completedReturnCount: number;
  totalRefundAmount: number;
  posRefundAmount: number;
  onlineRefundAmount: number;
  cashRefundAmount: number;
  transferRefundAmount: number;
  dailyRefunds: {
    date: string;
    refundAmount: number;
    cashRefundAmount: number;
    transferRefundAmount: number;
  }[];
}

export const returnApi = {
  getAll: async (
    params: ReturnFilterParams,
  ): Promise<PageResponse<ReturnResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ReturnResponse>>(
      "/manager/returns",
      {
        params: {
          status: params.status || undefined,
          keyword: params.keyword || undefined,
          fromDate: params.fromDate || undefined,
          toDate: params.toDate || undefined,
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort ?? "createdAt,desc",
        },
      },
    );
    return data;
  },

  getStatistics: async (params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<ReturnStatisticsResponse> => {
    const { data } = await axiosInstance.get<ReturnStatisticsResponse>(
      "/manager/returns/statistics",
      { params },
    );
    return data;
  },

  getById: async (id: number): Promise<ReturnResponse> => {
    const { data } = await axiosInstance.get<ReturnResponse>(
      `/manager/returns/${id}`,
    );
    return data;
  },

  create: async (request: CreateReturnRequest): Promise<ReturnResponse> => {
    const { data } = await axiosInstance.post<ReturnResponse>(
      "/manager/returns",
      request,
    );
    return data;
  },

  approve: async (id: number): Promise<ReturnResponse> => {
    const { data } = await axiosInstance.put<ReturnResponse>(
      `/manager/returns/${id}/approve`,
    );
    return data;
  },

  reject: async (
    id: number,
    payload: { rejectReason: string },
  ): Promise<ReturnResponse> => {
    const { data } = await axiosInstance.put<ReturnResponse>(
      `/manager/returns/${id}/reject`,
      payload,
    );
    return data;
  },

  complete: async (
    id: number,
    payload?: CompleteReturnRequest,
  ): Promise<ReturnResponse> => {
    const { data } = await axiosInstance.put<ReturnResponse>(
      `/manager/returns/${id}/complete`,
      payload,
    );
    return data;
  },

  uploadImage: uploadReturnImage,

  uploadImages: uploadReturnImages,
};
