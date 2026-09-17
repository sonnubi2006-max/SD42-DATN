import axiosInstance from "./axiosInstance";
import dayjs from "dayjs";

export interface Banner {
  bannerId: number;
  title: string;
  redirectUrl: string;
  imageUrl: string;
  startDate: Date;
  isActive: boolean;
  endDate: Date;
}

export interface CreateBannerRequest {
  title: string;
  redirectUrl: string;
  startDate: Date;
  endDate: Date;
  file: File;
}

export interface UpdateBannerRequest {
  title?: string;
  redirectUrl?: string;
  startDate?: Date;
  isActive?: boolean;
  endDate?: Date;
  file?: File;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; 
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface BannerParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  direction?: "asc" | "desc";
  isActive?: boolean;
}

export interface BannerStatisticProjection {
  totalBanners: number;
  activeBanners: number;
  inactiveBanners: number;
}

const bannerApi = {

  getAll: async (params?: BannerParams): Promise<PageResponse<Banner>> => {
    const { data } = await axiosInstance.get<PageResponse<Banner>>("/banners", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        sort: params?.sort ?? "bannerId",
        keyword: params?.keyword ?? "",
        direction: params?.direction ?? "desc",
        isActive: params?.isActive,
      },
    });
    return data;
  },

  getById: async (id: number): Promise<Banner> => {
    const { data } = await axiosInstance.get<Banner>(`/banners/${id}`);
    return data;
  },

  getBannerStatistics: async (): Promise<BannerStatisticProjection> => {
    const { data } =
      await axiosInstance.get<BannerStatisticProjection>(`/banners/statistics`);
    return data;
  },

  create: async (payload: CreateBannerRequest): Promise<Banner> => {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("redirectUrl", payload.redirectUrl);
    formData.append(
      "startDate",
      dayjs(payload.startDate).format("YYYY-MM-DDTHH:mm:ss"),
    );
    formData.append(
      "endDate",
      dayjs(payload.endDate).format("YYYY-MM-DDTHH:mm:ss"),
    );
    if (payload.file) formData.append("file", payload.file);

    const { data } = await axiosInstance.post<Banner>(
      "/admin/banners",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  update: async (id: number, payload: UpdateBannerRequest): Promise<Banner> => {
    const formData = new FormData();
    if (payload.title) formData.append("title", payload.title);
    if (payload.redirectUrl)
      formData.append("redirectUrl", payload.redirectUrl);
    if (payload.startDate)
      formData.append(
        "startDate",
        dayjs(payload.startDate).format("YYYY-MM-DDTHH:mm:ss"),
      );
    if (payload.endDate)
      formData.append(
        "endDate",
        dayjs(payload.endDate).format("YYYY-MM-DDTHH:mm:ss"),
      );
    if (payload.isActive !== undefined)
      formData.append("isActive", payload.isActive.toString());
    if (payload.file) formData.append("file", payload.file);

    const { data } = await axiosInstance.put<Banner>(
      `/admin/banners/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/admin/banners/${id}`);
  },
};

export default bannerApi;
