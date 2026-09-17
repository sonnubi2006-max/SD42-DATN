
import axiosInstance, { type PageResponse } from "./axiosInstance";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED";

export interface CreateReviewRequest {
  orderDetailId: number;
  rating: number;
  comment: string;
  sizeFeedback?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment: string;
  sizeFeedback?: string;
  imagesDelete?: number[];
}

export interface ReviewResponse {
  userAvatar?: string;
  reviewId: number;
  userId: number;
  userName: string;
  productId: number;
  productName: string;
  productCode: string;
  productSlug: string;
  variantId?: number;
  orderId?: number;
  orderCode?: string;
  color?: string;
  size?: string;
  rating: number;
  comment: string;
  sizeFeedback?: string;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  productImageUrl?: string;
  images: string[];
  createdAt: string;
}

export interface UnreviewedProductResponse {
  orderDetailId: number;
  orderId: number;
  orderCode: string;
  completedAt?: string;
  productId: number;
  productCode: string;
  productSlug: string;
  productName: string;
  imageUrl?: string;
  size?: string;
  color?: string;
}

export interface ReviewSummaryResponse {
  productId: number;
  averageRating: number;
  reviewCount: number;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  fiveStarPercent: number;
  fourStarPercent: number;
  threeStarPercent: number;
  twoStarPercent: number;
  oneStarPercent: number;
}

export interface ReviewParams {
  page?: number;
  size?: number;
  rating?: number | null;
}

const reviewApi = {
  getByProduct: async (
    productId: number,
    params?: ReviewParams,
  ): Promise<PageResponse<ReviewResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ReviewResponse>>(
      `/reviews/product/${productId}`,
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 10,
          rating: params?.rating ?? undefined,
        },
      },
    );
    return data;
  },

  getSummary: async (
    productId: number,
  ): Promise<ReviewSummaryResponse> => {
    const { data } = await axiosInstance.get<ReviewSummaryResponse>(
      `/reviews/product/${productId}/summary`,
    );
    return data;
  },

  getMyReviews: async (
    params?: ReviewParams,
  ): Promise<PageResponse<ReviewResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ReviewResponse>>(
      "/reviews/my-reviews",
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 10,
        },
      },
    );
    return data;
  },

  getMyUnreviewedProducts: async (
    params?: ReviewParams,
  ): Promise<PageResponse<UnreviewedProductResponse>> => {
    const { data } = await axiosInstance.get<
      PageResponse<UnreviewedProductResponse>
    >("/reviews/my-unreviewed-products", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return data;
  },

  create: async (
    payload: CreateReviewRequest,
    files?: File[],
  ): Promise<ReviewResponse> => {
    const fd = new FormData();
    fd.append("orderDetailId", String(payload.orderDetailId));
    fd.append("rating", String(payload.rating));
    fd.append("comment", payload.comment);
    if (payload.sizeFeedback)
      fd.append("sizeFeedback", payload.sizeFeedback);
    files?.forEach((f) => fd.append("files", f));

    const { data } = await axiosInstance.post<ReviewResponse>("/reviews", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (
    id: number,
    payload: UpdateReviewRequest,
    files?: File[],
  ): Promise<ReviewResponse> => {
    const fd = new FormData();
    fd.append("rating", String(payload.rating));
    fd.append("comment", payload.comment);
    if (payload.sizeFeedback)
      fd.append("sizeFeedback", payload.sizeFeedback);
    if (payload.imagesDelete?.length)
      fd.append("imagesDelete", JSON.stringify(payload.imagesDelete));
    files?.forEach((f) => fd.append("files", f));

    const { data } = await axiosInstance.put<ReviewResponse>(
      `/reviews/${id}`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/reviews/${id}`);
  },
};

export default reviewApi;
