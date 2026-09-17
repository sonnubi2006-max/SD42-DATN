import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import categoryApi from "../api/categoryApi";
import type {
  CategoryParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../api/categoryApi";

export const CATEGORY_KEYS = {
  all: ["categories"] as const,
  list: (params?: CategoryParams) => ["categories", "list", params] as const,
  detail: (id: number) => ["categories", "detail", id] as const,
  statictis: () => ["categories"] as const,
};

export function useCategoryList(params?: CategoryParams) {
  return useQuery({
    queryKey: CATEGORY_KEYS.list(params),
    queryFn: () => categoryApi.getAll(params),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export function useCategoryExportExcel() {
  return useMutation({
    mutationFn: ({ params, ids }: { params?: CategoryParams; ids?: number[] }) =>
      categoryApi.exportExcel(params, ids),

    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "categories.xlsx";

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

export function useCategoryDetail(id: number) {
  return useQuery({
    queryKey: CATEGORY_KEYS.detail(id),
    queryFn: () => categoryApi.getById(id),
    enabled: !!id,
  });
}

export function useCategoryStatictis() {
  return useQuery({
    queryKey: CATEGORY_KEYS.statictis(),
    queryFn: () => categoryApi.getCategoryStatistics(),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => categoryApi.create(payload),
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateCategoryRequest;
    }) => categoryApi.update(id, payload),
    onSuccess: (data) => {

      queryClient.setQueryData(CATEGORY_KEYS.detail(data.categoryId), data);
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onSuccess: (_, id) => {

      queryClient.removeQueries({ queryKey: CATEGORY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}
