import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  productVariantApi,
  type BulkVariantItem,
  type ProductVariantRequest,
  type ProductVariantStatus,
  type ProductVariantFilterParams,
} from "@/api/productVariantApi";

export const PRODUCT_VARIANT_KEYS = {
  all: ["productVariants"] as const,
  list: (params: ProductVariantFilterParams | number) =>
    ["productVariants", "list", params] as const,
  detail: (variantId: number) =>
    ["productVariants", "detail", variantId] as const,
};

export function useProductVariantList(params: ProductVariantFilterParams) {
  return useQuery({
    queryKey: PRODUCT_VARIANT_KEYS.list(params),
    queryFn: () => productVariantApi.filter(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
}

export function useAddProductVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
      file,
    }: {
      productId: number;
      data: ProductVariantRequest;
      file?: File;
    }) => productVariantApi.addVariant({ productId, data, file }),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: PRODUCT_VARIANT_KEYS.all });
      qc.invalidateQueries({ queryKey: ["products", "detail", productId] });
    },
  });
}

export function useBulkAddProductVariants() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      items,
    }: {
      productId: number;
      items: BulkVariantItem[];
    }) => productVariantApi.bulkAddVariants({ productId, items }),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: PRODUCT_VARIANT_KEYS.list(productId) });
      qc.invalidateQueries({ queryKey: ["products", "detail", productId] });
    },
  });
}

export function useUpdateProductVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      data,
      file,
    }: {
      variantId: number;
      data: ProductVariantRequest;
      file?: File;
    }) => productVariantApi.updateVariant({ variantId, data, file }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: PRODUCT_VARIANT_KEYS.all });
      qc.invalidateQueries({
        queryKey: PRODUCT_VARIANT_KEYS.detail(variables.variantId),
      });
    },
  });
}

export function useDeleteProductVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) =>
      productVariantApi.deleteVariant(variantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_VARIANT_KEYS.all });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRestoreProductVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) =>
      productVariantApi.restoreVariant(variantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_VARIANT_KEYS.all });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useChangeProductVariantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      status,
    }: {
      variantId: number;
      status: ProductVariantStatus;
    }) => productVariantApi.changeStatus(variantId, status),
    onSuccess: async (data) => {
      queryClient.setQueryData(
        PRODUCT_VARIANT_KEYS.detail(data.variantId),
        data,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: PRODUCT_VARIANT_KEYS.all,
          refetchType: "active",
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
          refetchType: "active",
        }),
      ]);
    },
  });
}

export function useBulkDeleteProductVariants() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => productVariantApi.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_VARIANT_KEYS.all });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useBulkUpdateVariantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      status,
    }: {
      ids: number[];
      status: ProductVariantStatus;
    }) => productVariantApi.bulkUpdateStatus({ variantIds: ids, status }),
    onSuccess: async (_data, { ids }) => {
      await Promise.all([
        ...ids.map((variantId) => qc.invalidateQueries({
          queryKey: PRODUCT_VARIANT_KEYS.detail(variantId),
          refetchType: "active",
        })),
        qc.invalidateQueries({
          queryKey: PRODUCT_VARIANT_KEYS.all,
          refetchType: "active",
        }),
        qc.invalidateQueries({
          queryKey: ["products"],
          refetchType: "active",
        }),
      ]);
    },
  });
}

export function useExportProductVariants() {
  return useMutation({
    mutationFn: ({
      params,
      ids,
    }: {
      params: ProductVariantFilterParams;
      ids?: number[];
    }) => productVariantApi.export(params, ids),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Danh_sach_bien_the_san_pham_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
