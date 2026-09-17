import axiosInstance from "./axiosInstance";

export type PromotionStatus = "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED";
export type ApplyType = "ORDER" | "PRODUCT" | "CATEGORY" | "VARIANT";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface PromotionResponse {
  promotionId: number;
  promotionCode: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  applyType: ApplyType;
  categoryIds: number[];
  productIds: number[];
  variantIds: number[];
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  active: boolean;
  createdAt: string;
}

export interface PromotionListParams {
  keyword?: string;
  status?: PromotionStatus;
  applyType?: ApplyType;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface PromotionPayload {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  applyType: ApplyType;
  categoryIds?: number[];
  productIds?: number[];
  variantIds?: number[];
  startDate: string;
  endDate: string;
  status?: PromotionStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

const BASE = "/admin/promotions";

export const promotionApi = {
  getList: (params: PromotionListParams) =>
    axiosInstance
      .get<PageResponse<PromotionResponse>>(BASE, { params })
      .then((res) => res.data),

  getById: (id: number) =>
    axiosInstance
      .get<PromotionResponse>(`${BASE}/${id}`)
      .then((res) => res.data),

  create: (payload: PromotionPayload) =>
    axiosInstance
      .post<PromotionResponse>(BASE, payload)
      .then((res) => res.data),

  update: (id: number, payload: PromotionPayload) =>
    axiosInstance
      .put<PromotionResponse>(`${BASE}/${id}`, payload)
      .then((res) => res.data),

  cancel: (id: number) =>
    axiosInstance
      .patch<PromotionResponse>(`${BASE}/${id}/cancel`)
      .then((res) => res.data),

  toggleStatus: (id: number) =>
    axiosInstance
      .patch<PromotionResponse>(`${BASE}/${id}/status`)
      .then((res) => res.data),
};
