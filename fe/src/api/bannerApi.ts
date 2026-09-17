
import axiosInstance, { type PageResponse } from "./axiosInstance";

export interface BannerResponse {
  bannerId: number;
  title: string;
  imageUrl: string;
  redirectUrl?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerParams {
  isActive?: boolean;
  keyword?: string;
  sort?: string;
  direction?: "asc" | "desc";
  checkDate?: boolean;
}

const bannerApi = {
  getAll: async (
    params?: BannerParams,
  ): Promise<PageResponse<BannerResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<BannerResponse>>(
      "/banners",
      {
        params: {
          isActive: params?.isActive ?? true,
          keyword: params?.keyword,
          sort: params?.sort ?? "bannerId",
          direction: params?.direction ?? "desc",
          checkDate: params?.checkDate ?? true,
        },
      },
    );
    return data;
  },
};

export default bannerApi;
