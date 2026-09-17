import axiosInstance from "./axiosInstance";
import type { Brand } from "./brandApi";
import type { Category } from "./categoryApi";
import type {
  ProductImageResponse,
  ProductVariantResponse,
} from "./productVariantApi";

export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface ProductResponse {
  productId: number;
  productName: string;
  productCode: string;
  description?: string;
  category: Category;
  brand: Brand;
  status: ProductStatus;
  averageRating: number;
  images: ProductImageResponse[];
  variants: ProductVariantResponse[];
  damagedQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export interface CreateProductRequest {
  productName: string;
  description?: string;
  categoryId: number;
  brandId: number;
  status: ProductStatus;
  files: File[];
}

export interface UpdateProductRequest extends Omit<
  CreateProductRequest,
  "files"
> {
  imagesDelete?: number[];
  files?: File[];
}

export interface ProductFilterParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
  categoryId?: number | null;
  brandId?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  status?: ProductStatus | null;
  keyword?: string;
}

function buildProductFormData(
  data: CreateProductRequest | UpdateProductRequest,
  files?: File[],
): FormData {
  const fd = new FormData();

  fd.append("productName", data.productName);
  if (data.description !== undefined) {
    fd.append("description", data.description);
  }
  fd.append("categoryId", String(data.categoryId));
  fd.append("brandId", String(data.brandId));
  fd.append("status", data.status);

  if ("imagesDelete" in data) {
    (data as UpdateProductRequest).imagesDelete?.forEach((id) =>
      fd.append("imagesDelete", String(id)),
    );
  }

  const fileList = files ?? (data as CreateProductRequest).files ?? [];
  fileList.forEach((f) => fd.append("files", f));

  return fd;
}

export const productApi = {
  filter: (
    params: ProductFilterParams,
  ): Promise<PageResponse<ProductResponse>> => {
    const sp = new URLSearchParams();
    if (params.page != null) sp.append("page", String(params.page));
    if (params.size != null) sp.append("size", String(params.size));
    if (params.sort)
      sp.append("sort", `${params.sort},${params.direction ?? "desc"}`);
    if (params.categoryId) sp.append("categoryId", String(params.categoryId));
    if (params.brandId) sp.append("brandId", String(params.brandId));
    if (params.minPrice != null) sp.append("minPrice", String(params.minPrice));
    if (params.maxPrice != null) sp.append("maxPrice", String(params.maxPrice));
    if (params.status) sp.append("status", params.status);
    if (params.keyword) sp.append("keyword", params.keyword);
    return axiosInstance
      .get(`/manager/products?${sp.toString()}`)
      .then((res) => res.data);
  },

  getById: (id: number): Promise<ProductResponse> =>
    axiosInstance.get(`/admin/products/${id}`).then((res) => res.data),

  create: (data: CreateProductRequest): Promise<ProductResponse> =>
    axiosInstance
      .post("/admin/products", buildProductFormData(data), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data),

  update: (
    id: number,
    data: UpdateProductRequest,
    files?: File[],
  ): Promise<ProductResponse> =>
    axiosInstance
      .put(`/admin/products/${id}`, buildProductFormData(data, files), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data),

  delete: (id: number): Promise<void> =>
    axiosInstance.delete(`/admin/products/${id}`).then(() => undefined),

  restore: (id: number): Promise<void> =>
    axiosInstance.patch(`/admin/products/${id}/restore`).then(() => undefined),

  changeStatus: (id: number, status: ProductStatus): Promise<ProductResponse> =>
    axiosInstance
      .patch(`/admin/products/${id}/status`, null, { params: { status } })
      .then((res) => res.data),

  bulkDelete: (ids: number[]): Promise<void> =>
    axiosInstance
      .patch("/admin/products/bulk-delete", ids)
      .then(() => undefined),

  bulkUpdateStatus: (ids: number[], status: ProductStatus): Promise<void> =>
    axiosInstance
      .patch("/admin/products/bulk-status", ids, { params: { status } })
      .then(() => undefined),

  getDeleted: (page = 0, size = 10): Promise<PageResponse<ProductResponse>> =>
    axiosInstance
      .get("/admin/products/deleted", { params: { page, size } })
      .then((res) => res.data),
  getPriceRange: (): Promise<{ min: number; max: number }> =>
    axiosInstance.get("/products/price-range").then((res) => res.data),
  export: (params: ProductFilterParams, ids?: number[]): Promise<Blob> => {
    const sp = new URLSearchParams();
    if (params.categoryId) sp.append("categoryId", String(params.categoryId));
    if (params.brandId) sp.append("brandId", String(params.brandId));
    if (params.minPrice != null) sp.append("minPrice", String(params.minPrice));
    if (params.maxPrice != null) sp.append("maxPrice", String(params.maxPrice));
    if (params.status) sp.append("status", params.status);
    if (params.keyword) sp.append("keyword", params.keyword);
    if (ids) ids.forEach((id) => sp.append("ids", String(id)));

    return axiosInstance
      .get(`/admin/products/export?${sp.toString()}`, {
        responseType: "blob", 
      })
      .then((res) => res.data as Blob);
  },
};
