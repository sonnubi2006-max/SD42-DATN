import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface PromotionEmailRequest {
  title: string;
  content: string;
}

export interface PromotionEmailResponse {
  queued: number;
}

export const marketingApi = {
  sendPromotion: async (payload: PromotionEmailRequest): Promise<ApiResponse<PromotionEmailResponse>> => {
    const { data } = await axiosInstance.post<ApiResponse<PromotionEmailResponse>>(
      "/admin/marketing/promotion",
      payload
    );
    return data;
  },
};
