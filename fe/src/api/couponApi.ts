import axiosInstance from "./axiosInstance";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type CouponStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
export type CouponType = "PUBLIC" | "PERSONAL";

export interface CouponResponse {
  couponId: number;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderValue: number | null;
  totalQuantity: number | null;
  usedQuantity?: number;
  remainingQuantity: number | null;
  maxUsesPerUser: number | null;
  usedByCurrentUser: number | null;
  remainingUsesForCurrentUser: number | null;
  startDate?: string;
  endDate?: string;
  status: CouponStatus;
  couponType?: CouponType;
  valid: boolean;
  createdAt?: string;
}

export interface ValidateCouponRequest {
  code: string;
  orderAmount: number;
}

const couponApi = {
  validate: async (
    payload: ValidateCouponRequest,
  ): Promise<CouponResponse> => {
    const { data } = await axiosInstance.post<CouponResponse>(
      "/coupons/validate",
      payload,
    );
    return data;
  },

  getActiveCoupons: async (): Promise<CouponResponse[]> => {
    const { data } = await axiosInstance.get<CouponResponse[]>("/coupons");
    return data;
  },
};

export function couponDiscount(
  coupon: CouponResponse,
  orderAmount: number,
): number {
  if (coupon.minOrderValue && orderAmount < coupon.minOrderValue) {
    return 0;
  }
  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (orderAmount * coupon.discountValue) / 100
      : coupon.discountValue;
  if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
    discount = coupon.maxDiscountAmount;
  }
  return Math.min(discount, orderAmount);
}

export default couponApi;
