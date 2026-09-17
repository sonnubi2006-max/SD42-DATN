
import axiosInstance from "./axiosInstance";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface PromotionResponse {
  promotionId: number;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  applyType?: string;
  categoryIds?: number[];
  productIds?: number[];
  startDate?: string;
  endDate?: string;
  status?: string;
  active?: boolean;
  createdAt?: string;
}

const promotionApi = {
  getActive: async (): Promise<PromotionResponse[]> => {
    const { data } = await axiosInstance.get<PromotionResponse[]>(
      "/promotions/active",
    );
    return data;
  },
};

export default promotionApi;
