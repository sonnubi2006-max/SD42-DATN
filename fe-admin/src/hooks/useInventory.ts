import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { inventoryApi, goodsReceiptApi } from "@/api/inventoryApi";
import type {
  InventoryAdjustmentRequest,
  GoodsReceiptRequest,
} from "@/api/inventoryApi";

export const INVENTORY_KEYS = {
  all: ["inventories"] as const,
  list: (params: object) => ["inventories", "list", params] as const,
  detail: (id: number) => ["inventories", "detail", id] as const,
  transactions: (variantId: number, page: number) =>
    ["inventories", "transactions", variantId, page] as const,
};

export const RECEIPT_KEYS = {
  all: ["goods-receipts"] as const,
  list: (params: object) => ["goods-receipts", "list", params] as const,
  detail: (id: number) => ["goods-receipts", "detail", id] as const,
};

export function useInventoryList(params: {
  keyword?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: INVENTORY_KEYS.list(params),
    queryFn: () => inventoryApi.getAll(params),
    placeholderData: keepPreviousData,
  });
}

export function useInventoryDetail(variantId: number | null) {
  return useQuery({
    queryKey: INVENTORY_KEYS.detail(variantId!),
    queryFn: () => inventoryApi.getOne(variantId!),
    enabled: variantId !== null,
  });
}

export function useInventoryTransactions(variantId: number | null, page = 0) {
  return useQuery({
    queryKey: INVENTORY_KEYS.transactions(variantId!, page),
    queryFn: () => inventoryApi.getTransactions(variantId!, page),
    enabled: variantId !== null,
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      request,
    }: {
      variantId: number;
      request: InventoryAdjustmentRequest;
    }) => inventoryApi.adjust(variantId, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
    },
  });
}

export function useGoodsReceiptList(params: {
  receiptCode?: string;
  supplierId?: number;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: RECEIPT_KEYS.list(params),
    queryFn: () => goodsReceiptApi.getAll(params),
    placeholderData: keepPreviousData,
  });
}

export function useGoodsReceiptDetail(id: number | null) {
  return useQuery({
    queryKey: RECEIPT_KEYS.detail(id!),
    queryFn: () => goodsReceiptApi.getById(id!),
    enabled: id !== null,
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: GoodsReceiptRequest) =>
      goodsReceiptApi.create(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
    },
  });
}

export function useApproveGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (receiptId: number) => goodsReceiptApi.approve(receiptId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
    },
  });
}

export function useDeleteGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => goodsReceiptApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
    },
  });
}
