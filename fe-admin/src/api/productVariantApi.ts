import axiosInstance from "./axiosInstance";

export interface ProductVariantFilterParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
  productId?: number | null;
  status?: ProductVariantStatus | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  keyword?: string;
}

export type ProductVariantStatus = "ACTIVE" | "INACTIVE";

export interface ProductImageResponse {
  imageId: number;
  imageUrl: string;
  isThumbnail: boolean;
}

export interface ProductVariantResponse {
  variantId: number;
  productId?: number;
  variantCode: string;
  barcode: string;
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
  availableStock?: number;
  damagedQuantity?: number;
  reservedQuantity: number;
  image: ProductImageResponse;
  createdAt: string;
  status: ProductVariantStatus;
  salePrice?: number;
  discountPercentage?: number;
  productName?: string;
  productCode?: string;
}

export interface VariantDamageRecord {
  source: "ORDER_DELIVERY" | "EXCHANGE_RETURN" | "EXCHANGE_DELIVERY";
  sourceId: number;
  orderId: number;
  orderCode: string;
  damagedQuantity: number;
  recordedAt: string | null;
}

export interface VariantDamageResponse {
  variantId: number;
  variantCode: string;
  totalDamagedQuantity: number;
  filteredDamagedQuantity: number;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
  records: VariantDamageRecord[];
}

export interface VariantDamageFilterParams {
  keyword?: string;
  source?: VariantDamageRecord["source"];
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface ProductVariantRequest {
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
  status?: ProductVariantStatus;
  file?: File;
  image?: ProductImageResponse;
}

export interface BulkUpdateProductVariantStatusRequest {
  variantIds: number[];
  status: ProductVariantStatus;
}

interface AddVariantArgs {
  productId: number;
  data: ProductVariantRequest;
  file?: File;
}

export interface BulkVariantItem {
  data: ProductVariantRequest;
  file: File;
}

interface BulkAddVariantsArgs {
  productId: number;
  items: BulkVariantItem[];
}

interface UpdateVariantArgs {
  variantId: number;
  data: ProductVariantRequest;
  file?: File;
}

function buildProductVariantFormData(data: ProductVariantRequest, file?: File) {
  const fd = new FormData();

  const variantFile = file ?? data.file;

  fd.append("size", data.size);
  fd.append("color", data.color);
  fd.append("price", String(data.price));
  fd.append("stockQuantity", String(data.stockQuantity));

  if (data.status) {
    fd.append("status", data.status);
  }

  if (variantFile) {
    fd.append("file", variantFile);
  }

  return fd;
}

function toVariantPayload(data: ProductVariantRequest) {
  return {
    size: data.size,
    color: data.color,
    price: data.price,
    stockQuantity: data.stockQuantity,
    status: data.status,
  };
}

export const productVariantApi = {
  getDamageHistory: (
    variantId: number,
    params?: VariantDamageFilterParams,
  ): Promise<VariantDamageResponse> =>
    axiosInstance
      .get(`/admin/products/variants/${variantId}/damages`, { params })
      .then((res) => res.data),
  getById: (id: number): Promise<ProductVariantResponse> =>
    axiosInstance.get(`/products/variants/${id}`).then((res) => res.data),

  findByBarcode: (code: string): Promise<ProductVariantResponse> =>
    axiosInstance
      .get(`/products/variants/barcode/${encodeURIComponent(code.trim())}`)
      .then((res) => res.data),

  getQrCode: (variantId: number): Promise<Blob> =>
    axiosInstance
      .get(`/admin/products/variants/${variantId}/qr-code`, {
        responseType: "blob",
      })
      .then((res) => res.data as Blob),

  addVariant: ({
    productId,
    data,
    file,
  }: AddVariantArgs): Promise<ProductVariantResponse> =>
    axiosInstance
      .post(
        `/admin/products/${productId}/variants`,
        buildProductVariantFormData(data, file),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      )
      .then((res) => res.data),

  bulkAddVariants: ({
    productId,
    items,
  }: BulkAddVariantsArgs): Promise<ProductVariantResponse[]> => {
    const fd = new FormData();

    fd.append(
      "variants",
      JSON.stringify(items.map((item) => toVariantPayload(item.data))),
    );

    items.forEach((item) => {
      fd.append("files", item.file);
    });

    return axiosInstance
      .post(`/admin/products/${productId}/variants/bulk`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data);
  },

  updateVariant: ({
    variantId,
    data,
    file,
  }: UpdateVariantArgs): Promise<ProductVariantResponse> =>
    axiosInstance
      .put(
        `/admin/products/variants/${variantId}`,
        buildProductVariantFormData(data, file),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      )
      .then((res) => res.data),

  deleteVariant: (variantId: number): Promise<void> =>
    axiosInstance
      .delete(`/admin/products/variants/${variantId}`)
      .then(() => undefined),

  restoreVariant: (variantId: number): Promise<void> =>
    axiosInstance
      .patch(`/admin/products/variants/${variantId}/restore`)
      .then(() => undefined),

  changeStatus: (
    variantId: number,
    status: ProductVariantStatus,
  ): Promise<ProductVariantResponse> =>
    axiosInstance
      .patch(`/admin/products/variants/${variantId}/status`, null, {
        params: {
          status,
        },
      })
      .then((res) => res.data),

  bulkDelete: (ids: number[]): Promise<void> =>
    axiosInstance
      .delete("/admin/products/variants/bulk-delete", {
        data: ids,
      })
      .then(() => undefined),

  filter: (
    params: ProductVariantFilterParams,
  ): Promise<import("./productApi").PageResponse<ProductVariantResponse>> => {
    return axiosInstance
      .get(`/admin/products/variants`, { params })
      .then((res) => res.data);
  },

  bulkUpdateStatus: (
    payload: BulkUpdateProductVariantStatusRequest,
  ): Promise<void> =>
    axiosInstance
      .put("/admin/products/variants/bulk-status", payload)
      .then(() => undefined),

  export: (
    params: ProductVariantFilterParams,
    ids?: number[],
  ): Promise<Blob> => {
    const sp = new URLSearchParams();

    if (params.productId) sp.append("productId", String(params.productId));

    if (params.status) sp.append("status", params.status);

    if (params.minPrice != null) sp.append("minPrice", String(params.minPrice));

    if (params.maxPrice != null) sp.append("maxPrice", String(params.maxPrice));

    if (params.keyword) sp.append("keyword", params.keyword);

    ids?.forEach((id) => {
      sp.append("ids", String(id));
    });

    return axiosInstance
      .get(`/admin/products/variants/export`, {
        params,
        responseType: "blob",
      })
      .then((res) => res.data as Blob);
  },
};
