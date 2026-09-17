import axiosInstance, { type PageResponse } from "./axiosInstance";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED";

export interface ReviewResponse {
  reviewId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  productId: number;
  productName: string;
  productCode: string;
  variantId?: number;
  color?: string;
  size?: string;
  rating: number;
  comment: string;
  sizeFeedback?: string;
  status: ReviewStatus;
  productImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
  verifiedPurchase: boolean;
}

export interface ReviewFilterParams {
  fromDate?: string;
  toDate?: string;
  status?: ReviewStatus;
  rating?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const reviewApi = {
  filterReviews: async (params?: ReviewFilterParams): Promise<PageResponse<ReviewResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ReviewResponse>>(
      "/admin/reviews",
      {
        params: {
          ...params,
          sort: params?.sort ?? "reviewId,desc",
        },
      }
    );
    return data;
  },

  approve: async (id: number): Promise<ReviewResponse> => {
    const { data } = await axiosInstance.patch<ReviewResponse>(
      `/admin/reviews/${id}/approve`
    );
    return data;
  },

  reject: async (id: number): Promise<ReviewResponse> => {
    const { data } = await axiosInstance.patch<ReviewResponse>(
      `/admin/reviews/${id}/reject`
    );
    return data;
  },

  hide: async (id: number): Promise<ReviewResponse> => {
    const { data } = await axiosInstance.patch<ReviewResponse>(
      `/admin/reviews/${id}/hide`
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/reviews/${id}`);
  },
};
