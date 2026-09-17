import axiosInstance from "./axiosInstance";

export type CouponStatus = "UPCOMING" | "ACTIVE" | "EXPIRED" | "INACTIVE";
export type CouponType = "PUBLIC" | "PERSONAL";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface TargetedCustomer {
  customerId: number;
  fullName: string | null;
  email: string | null;
}

export interface CouponResponse {
  couponId: number;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderValue: number | null;
  totalQuantity: number | null;
  usedQuantity: number;
  maxUsesPerUser: number | null;
  usedByCurrentUser: number | null;
  remainingUsesForCurrentUser: number | null;
  remainingQuantity: number | null;
  startDate?: string;
  endDate?: string;
  status: CouponStatus;
  couponType: CouponType;
  targetedCustomers?: TargetedCustomer[];
  valid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponListParams {
  keyword?: string;
  status?: CouponStatus;
  type?: CouponType;
  discountType?: DiscountType;
  startDate?: string;
  endDate?: string;
  customerId?: number;
  page?: number;
  size?: number;
}

export interface CouponPayload {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  totalQuantity?: number;
  maxUsesPerUser?: number;
  startDate?: string;
  endDate?: string;
  status?: CouponStatus;
  couponType: CouponType;

  targetedCustomerIds?: number[];
}

export interface ValidateCouponPayload {
  code: string;
  orderAmount: number;
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

const BASE = "/admin/coupons";

export const couponApi = {
  getList: (params: CouponListParams) =>
    axiosInstance
      .get<PageResponse<CouponResponse>>("/manager/coupons", { params })
      .then((res) => res.data),

  getById: (id: number) =>
    axiosInstance.get<CouponResponse>(`${BASE}/${id}`).then((res) => res.data),

  create: (payload: CouponPayload) =>
    axiosInstance.post<CouponResponse>(BASE, payload).then((res) => res.data),

  update: (id: number, payload: CouponPayload) =>
    axiosInstance
      .put<CouponResponse>(`${BASE}/${id}`, payload)
      .then((res) => res.data),

  setStatus: (id: number, status: CouponStatus) =>
    axiosInstance
      .patch(`${BASE}/${id}/status`, null, { params: { status } })
      .then((res) => res.data),

  validate: (payload: ValidateCouponPayload) =>
    axiosInstance
      .post<CouponResponse>("/coupons/validate", payload)
      .then((res) => res.data),
};
