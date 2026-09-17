import axiosInstance from "./axiosInstance";

export type BrandStatus = "ACTIVE" | "INACTIVE";

export interface Brand {
  brandId: number;
  brandName: string;
  brandCode: string;
  brandStatus: BrandStatus;
  brandLogo: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBrandRequest {
  brandName: string;
  brandStatus: BrandStatus;
  file: File;
}

export interface UpdateBrandRequest {
  brandName?: string;
  brandStatus?: BrandStatus;
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

export interface BrandParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  direction?: "asc" | "desc";
  status?: BrandStatus | null;
}

export interface BrandStatisticProjection {
  totalBrands: number;
  activeBrands: number;
  inactiveBrands: number;
}

const brandApi = {

  getAll: async (params?: BrandParams): Promise<PageResponse<Brand>> => {
    const { data } = await axiosInstance.get<PageResponse<Brand>>("/brand", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        sort: params?.sort ?? "brandId",
        keyword: params?.keyword ?? "",
        direction: params?.direction ?? "desc",
        status: params?.status,
      },
    });
    return data;
  },

  getById: async (id: number): Promise<Brand> => {
    const { data } = await axiosInstance.get<Brand>(`/brand/${id}`);
    return data;
  },

  getBrandStatistics: async (): Promise<BrandStatisticProjection> => {
    const { data } = await axiosInstance.get<BrandStatisticProjection>(
      `/admin/brand/statistics`,
    );
    return data;
  },

  create: async (payload: CreateBrandRequest): Promise<Brand> => {
    const formData = new FormData();
    formData.append("brandName", payload.brandName);
    formData.append("brandStatus", payload.brandStatus);
    if (payload.file) formData.append("file", payload.file);

    const { data } = await axiosInstance.post<Brand>("/admin/brand", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (id: number, payload: UpdateBrandRequest): Promise<Brand> => {
    const formData = new FormData();
    if (payload.brandName) formData.append("brandName", payload.brandName);
    if (payload.brandStatus)
      formData.append("brandStatus", payload.brandStatus);
    if (payload.file) formData.append("file", payload.file);

    const { data } = await axiosInstance.put<Brand>(
      `/admin/brand/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/admin/brand/${id}`);
  },

  exportExcel: async (params?: BrandParams, ids?: number[]): Promise<Blob> => {
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
      .get(`/admin/brand/export/excel?${sp.toString()}`, {
        responseType: "blob",
      })
      .then((res) => res.data as Blob);
  },
};

export default brandApi;
