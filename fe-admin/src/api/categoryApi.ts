import axiosInstance from "./axiosInstance";

export type CategoryStatus = "ACTIVE" | "INACTIVE";

export interface Category {
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  categoryDescription?: string;
  categoryStatus: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  categoryName: string;
  categoryDescription?: string;
  categoryStatus: CategoryStatus;
}

export interface UpdateCategoryRequest {
  categoryName?: string;
  categoryDescription?: string;
  categoryStatus?: CategoryStatus;
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

export interface CategoryParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  direction?: "asc" | "desc";
  status?: CategoryStatus | null;
}

export interface CategoryStatisticProjection {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
}

const categoryApi = {

  getAll: async (params?: CategoryParams): Promise<PageResponse<Category>> => {
    const { data } = await axiosInstance.get<PageResponse<Category>>(
      "/category",
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 10,
          sort: params?.sort ?? "categoryId",
          keyword: params?.keyword ?? "",
          direction: params?.direction ?? "desc",
          status: params?.status,
        },
      },
    );
    return data;
  },

  getById: async (id: number): Promise<Category> => {
    const { data } = await axiosInstance.get<Category>(`/category/${id}`);
    return data;
  },

  getCategoryStatistics: async (): Promise<CategoryStatisticProjection> => {
    const { data } =
      await axiosInstance.get<CategoryStatisticProjection>(
        `/category/statistics`,
      );
    return data;
  },

  create: async (payload: CreateCategoryRequest): Promise<Category> => {
    const { data } = await axiosInstance.post<Category>(
      "/admin/category",
      payload,
    );
    return data;
  },

  update: async (
    id: number,
    payload: UpdateCategoryRequest,
  ): Promise<Category> => {
    const { data } = await axiosInstance.put<Category>(
      `/admin/category/${id}`,
      payload,
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/admin/category/${id}`);
  },

  exportExcel: async (
    params?: CategoryParams,
    ids?: number[],
  ): Promise<Blob> => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.status) sp.append("status", params.status);
      if (params.keyword) sp.append("keyword", params.keyword);
      if (params.direction) sp.append("direction", params.direction);
      if (params.sort) sp.append("sort", params.sort);
    }
    if (ids && ids.length > 0) {
      ids.forEach((id) => sp.append("ids", String(id)));
    }
    return axiosInstance
      .get(`/category/export/excel?${sp.toString()}`, {
        responseType: "blob",
      })
      .then((res) => res.data as Blob);
  },
};

export default categoryApi;
