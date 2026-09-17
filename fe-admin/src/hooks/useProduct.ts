import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { productApi } from "@/api/productApi";
import type {
  ProductFilterParams,
  CreateProductRequest,
  UpdateProductRequest,
  ProductStatus,
} from "@/api/productApi";

export const PRODUCT_KEYS = {
  all: ["products"] as const,
  list: (params: ProductFilterParams) => ["products", "list", params] as const,
  detail: (id: number) => ["products", "detail", id] as const,
  deleted: () => ["products", "deleted"] as const,
};

export function useProductList(params: ProductFilterParams) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: () => productApi.filter(params),
    placeholderData: keepPreviousData,
  });
}

export function useProductPriceRange() {
  return useQuery({
    queryKey: ["products", "price-range"] as const,
    queryFn: () => productApi.getPriceRange(),
    staleTime: 60 * 1000 * 10, 
  });
}

export function useProductById(id: number | null) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id!),
    queryFn: () => productApi.getById(id!),
    enabled: id !== null,
  });
}

export function useDeletedProducts(page = 0) {
  return useQuery({
    queryKey: PRODUCT_KEYS.deleted(),
    queryFn: () => productApi.getDeleted(page),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => productApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: number;
      data: UpdateProductRequest;
      files?: File[];
    }) => productApi.update(id, data, files),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(id) });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}

export function useRestoreProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}

export function useChangeProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProductStatus }) =>
      productApi.changeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => productApi.bulkDelete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: ProductStatus }) =>
      productApi.bulkUpdateStatus(ids, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}

export function useExportProducts() {
  return useMutation({
    mutationFn: ({
      params,
      ids,
    }: {
      params: ProductFilterParams;
      ids?: number[];
    }) => productApi.export(params, ids),
    onSuccess: (blob, variables) => {

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      a.download = `Danh_sach_san_pham_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
