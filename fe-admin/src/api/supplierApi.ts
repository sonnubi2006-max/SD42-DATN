import axiosInstance from "./axiosInstance";

export type SupplierStatus = "true" | "false";

export interface Supplier {
  supplierId: number;
  supplierName: string;
  address: string;
  phone: string;
  email: string;
  status: SupplierStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierRequest {
  supplierName: string;
  address: string;
  phone: string;
  email: string;
}

export interface UpdateSupplierRequest {
  supplierName?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: SupplierStatus;
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

export interface SupplierParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  direction?: "asc" | "desc";
  status?: SupplierStatus | null;
}

export interface SupplierStatisticProjection {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
}

const supplierApi = {

  getAll: async (params?: SupplierParams): Promise<PageResponse<Supplier>> => {
    const { data } = await axiosInstance.get<PageResponse<Supplier>>(
      "/admin/supplier",
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 10,
          sort: params?.sort ?? "supplierId",
          direction: params?.direction ?? "desc",
          ...(params?.keyword && { keyword: params.keyword }),
          ...(params?.status && { status: params.status }),
        },
      },
    );
    return data;
  },

  getById: async (id: number): Promise<Supplier> => {
    const { data } = await axiosInstance.get<Supplier>(`/admin/supplier/${id}`);
    return data;
  },

  create: async (payload: CreateSupplierRequest): Promise<Supplier> => {
    const { data } = await axiosInstance.post<Supplier>(
      "/admin/supplier",
      payload,
    );
    return data;
  },

  update: async (
    id: number,
    payload: UpdateSupplierRequest,
  ): Promise<Supplier> => {
    const { data } = await axiosInstance.put<Supplier>(
      `/admin/supplier/${id}`,
      payload,
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/admin/supplier/${id}`);
  },

  restore: async (id: number): Promise<void> => {
    await axiosInstance.patch(`/admin/supplier/${id}`);
  },

  getStatistics: async (): Promise<SupplierStatisticProjection> => {
    const { data } = await axiosInstance.get<SupplierStatisticProjection>(
      "/admin/supplier/stats",
    );
    return data;
  },
};

export default supplierApi;
