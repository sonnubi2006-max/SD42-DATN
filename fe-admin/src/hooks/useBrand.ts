import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import brandApi from "../api/brandApi";
import type {
  BrandParams,
  CreateBrandRequest,
  UpdateBrandRequest,
} from "../api/brandApi";

export const BRAND_KEYS = {
  all: ["brands"] as const,
  list: (params?: BrandParams) => ["brands", "list", params] as const,
  detail: (id: number) => ["brands", "detail", id] as const,
  statictis: () => ["brands"] as const,
};

export function useBrandList(params?: BrandParams) {
  return useQuery({
    queryKey: BRAND_KEYS.list(params),
    queryFn: () => brandApi.getAll(params),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export function useBrandDetail(id: number) {
  return useQuery({
    queryKey: BRAND_KEYS.detail(id),
    queryFn: () => brandApi.getById(id),
    enabled: !!id,
  });
}

export function useBrandStatictis() {
  return useQuery({
    queryKey: BRAND_KEYS.statictis(),
    queryFn: () => brandApi.getBrandStatistics(),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBrandRequest) => brandApi.create(payload),
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateBrandRequest;
    }) => brandApi.update(id, payload),
    onSuccess: (data) => {

      queryClient.setQueryData(BRAND_KEYS.detail(data.brandId), data);
      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => brandApi.delete(id),
    onSuccess: (_, id) => {

      queryClient.removeQueries({ queryKey: BRAND_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
    },
  });
}

export function useBrandExportExcel() {
  return useMutation({
    mutationFn: ({ params, ids }: { params?: BrandParams; ids?: number[] }) =>
      brandApi.exportExcel(params, ids),

    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "brands.xlsx";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    },

    onError: (error: any) => {
      console.error(error);
    },
  });
}
