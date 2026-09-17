
import axiosInstance, { type PageResponse } from "./axiosInstance";

export type BrandStatus = "ACTIVE" | "INACTIVE";

export interface Brand {
  brandId: number;
  brandName: string;
  brandLogo?: string;
  brandStatus?: BrandStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  direction?: "asc" | "desc";
  status?: BrandStatus | null;
}

const brandApi = {
  getAll: async (params?: BrandParams): Promise<PageResponse<Brand>> => {
    const { data } = await axiosInstance.get<PageResponse<Brand>>("/brand", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 100,
        sort: params?.sort ?? "brandId",
        keyword: params?.keyword ?? "",
        direction: params?.direction ?? "asc",
        status: params?.status ?? "ACTIVE",
      },
    });
    return data;
  },

  getById: async (id: number): Promise<Brand> => {
    const { data } = await axiosInstance.get<Brand>(`/brand/${id}`);
    return data;
  },
};

export default brandApi;
