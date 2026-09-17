import axiosInstance, { type PageResponse } from "./axiosInstance";
import type { ExchangeItemResponse } from "./returnApi";
import type { ExchangeFulfillmentMethod } from "./returnApi";

export type ExchangeDeliveryStatus =
  | "PREPARING"
  | "SHIPPING"
  | "DELIVERED"
  | "FAILED_DELIVERY"
  | "RETURNING"
  | "RETURNED_TO_SHOP"
  | "CANCELLED"
  | "CANCELED_BY_DAMAGED"
  | "FAILED";

export interface ExchangeDeliveryLogResponse {
  logId: number;
  previousStatus: ExchangeDeliveryStatus | null;
  currentStatus: ExchangeDeliveryStatus;
  note: string | null;
  evidenceImages: string[];
  createdById: number | null;
  createdByName: string;
  createdAt: string;
}

export interface ExchangeDeliveryResponse {
  exchangeDeliveryId: number;
  deliveryCode: string;
  fulfillmentMethod: ExchangeFulfillmentMethod;
  status: ExchangeDeliveryStatus;
  returnId: number;
  orderId: number;
  orderCode: string;
  customerId: number | null;
  customerCode: string | null;
  processedById: number | null;
  processedByName: string | null;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string | null;
  shippingFee: number;
  note: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  returnedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ExchangeItemResponse[];
  history: ExchangeDeliveryLogResponse[];
}

export interface UpdateExchangeDeliveryRequest {
  status?: ExchangeDeliveryStatus;
  note?: string;
  damagedItems?: { variantId: number; damagedQuantity: number }[];
}

export const exchangeDeliveryApi = {
  getById: async (id: number): Promise<ExchangeDeliveryResponse> => {
    const { data } = await axiosInstance.get<ExchangeDeliveryResponse>(
      `/manager/exchange-deliveries/${id}`,
    );
    return data;
  },
  getAll: async (params: { status?: ExchangeDeliveryStatus; keyword?: string; fromDate?: string; toDate?: string; page?: number; size?: number }) => {
    const { data } = await axiosInstance.get<PageResponse<ExchangeDeliveryResponse>>("/manager/exchange-deliveries", {
      params: { ...params, sort: "createdAt,desc" },
    });
    return data;
  },
  update: async (id: number, payload: UpdateExchangeDeliveryRequest, images?: File[]) => {
    const formData = new FormData();
    formData.append("request", JSON.stringify(payload));
    images?.forEach((image) => formData.append("images", image));
    const { data } = await axiosInstance.patch<ExchangeDeliveryResponse>(
      `/manager/exchange-deliveries/${id}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
};
