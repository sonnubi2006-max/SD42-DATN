import axiosInstance from "./axiosInstance";

export type AdjustmentType = "IMPORT" | "EXPORT" | "ADJUST";
export type InventoryTransactionType =
  | "IMPORT"
  | "EXPORT"
  | "ADJUST"
  | "RESERVE"
  | "RELEASE";
export type ReceiptStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface InventoryResponse {
  inventoryId: number;
  variantId: number;
  sku: string;
  productName: string;
  stockQuantity: number;
  reservedQuantity: number;
  avgCostPrice: number;
  variant: VariantInventory;
}

export interface VariantInventory {
  variantId: number;
  sku: number;
  barcode: number;
  size: number;
  color: number;
}

export interface InventoryTransactionResponse {
  transactionId: number;
  inventoryId: number;
  type: InventoryTransactionType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceCode: string | null;
  createdAt: string;
}

export interface GoodsReceiptDetailResponse {
  detailId: number;
  productId: number;
  productName: string;
  quantity: number;
  importPrice: number;
  subtotal: number;
}

export interface SupplierGoodReceipt {
  supplierId: number;
  supplierName: string;
}

export interface AuthorGoodReceipt {
  userId: number;
  fullName: string;
}

export interface GoodsReceiptResponse {
  receiptId: number;
  receiptCode: string;
  supplier: SupplierGoodReceipt;
  author: AuthorGoodReceipt;
  status: ReceiptStatus;
  receiptDate: string;
  createdAt: string;
  totalAmount: number;
  note: string | null;
  details: GoodsReceiptDetailResponse[];
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export interface InventoryAdjustmentRequest {
  quantity: number;
  type: AdjustmentType;
  note?: string;
}

export interface GoodsReceiptDetailRequest {
  variantId: number;
  quantity: number;
  importPrice: number;
}

export interface GoodsReceiptRequest {
  supplierId: number;
  note?: string;
  items: GoodsReceiptDetailRequest[];
}

export const inventoryApi = {
  getAll: (params: {
    keyword?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<InventoryResponse>> =>
    axiosInstance
      .get("/admin/inventories", {
        params: {
          keyword: params.keyword || undefined,
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort,
        },
      })
      .then((res) => res.data),

  getOne: (variantId: number): Promise<InventoryResponse> =>
    axiosInstance
      .get(`/admin/inventories/${variantId}`)
      .then((res) => res.data),

  getTransactions: (
    variantId: number,
    page = 0,
    size = 10,
  ): Promise<PageResponse<InventoryTransactionResponse>> =>
    axiosInstance
      .get(`/admin/inventories/transactions/${variantId}`, {
        params: { page, size },
      })
      .then((res) => res.data),

  adjust: (
    variantId: number,
    request: InventoryAdjustmentRequest,
  ): Promise<void> =>
    axiosInstance
      .post(`/admin/inventories/adjustment/${variantId}`, request)
      .then(() => undefined),
};

export const goodsReceiptApi = {
  getAll: (params: {
    receiptCode?: string;
    supplierId?: number;
    page?: number;
    size?: number;
  }): Promise<PageResponse<GoodsReceiptResponse>> =>
    axiosInstance
      .get("/admin/goods-receipts", {
        params: {
          receiptCode: params.receiptCode || undefined,
          supplierId: params.supplierId || undefined,
          page: params.page ?? 0,
          size: params.size ?? 10,
        },
      })
      .then((res) => res.data),

  getById: (id: number): Promise<GoodsReceiptResponse> =>
    axiosInstance.get(`/admin/goods-receipts/${id}`).then((res) => res.data),

  create: (request: GoodsReceiptRequest): Promise<GoodsReceiptResponse> =>
    axiosInstance
      .post("/admin/goods-receipts", request)
      .then((res) => res.data),

  approve: (receiptId: number): Promise<GoodsReceiptResponse> =>
    axiosInstance
      .patch(`/admin/goods-receipts/${receiptId}`)
      .then((res) => res.data),

  delete: (id: number): Promise<void> =>
    axiosInstance.delete(`/admin/goods-receipts/${id}`).then(() => undefined),
};
