
import axiosInstance, { type PageResponse } from "./axiosInstance";

export type CategoryStatus = "ACTIVE" | "INACTIVE";

export interface Category {
  categoryId: number;
  categoryName: string;
  categoryDescription?: string;
  categoryStatus?: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  direction?: "asc" | "desc";
  status?: CategoryStatus | null;
}

const categoryApi = {
  getAll: async (params?: CategoryParams): Promise<PageResponse<Category>> => {
    const { data } = await axiosInstance.get<PageResponse<Category>>(
      "/category",
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 100,
          sort: params?.sort ?? "categoryId",
          keyword: params?.keyword ?? "",
          direction: params?.direction ?? "asc",
          status: params?.status ?? "ACTIVE",
        },
      },
    );
    return data;
  },

  getById: async (id: number): Promise<Category> => {
    const { data } = await axiosInstance.get<Category>(`/category/${id}`);
    return data;
  },
};

export default categoryApi;
