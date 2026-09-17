import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import supplierApi from "../api/supplierApi";
import type {
  SupplierParams,
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from "../api/supplierApi";

export const SUPPLIER_KEYS = {
  all: ["suppliers"] as const,
  list: (params?: SupplierParams) => ["suppliers", "list", params] as const,
  detail: (id: number) => ["suppliers", "detail", id] as const,
  statistics: () => ["suppliers", "statistics"] as const,
};

export function useSupplierList(params?: SupplierParams) {
  return useQuery({
    queryKey: SUPPLIER_KEYS.list(params),
    queryFn: () => supplierApi.getAll(params),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export function useSupplierDetail(id: number) {
  return useQuery({
    queryKey: SUPPLIER_KEYS.detail(id),
    queryFn: () => supplierApi.getById(id),
    enabled: !!id,
  });
}

export function useSupplierStatistics() {
  return useQuery({
    queryKey: SUPPLIER_KEYS.statistics(),
    queryFn: () => supplierApi.getStatistics(),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierRequest) => supplierApi.create(payload),
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateSupplierRequest;
    }) => supplierApi.update(id, payload),
    onSuccess: (data) => {

      queryClient.setQueryData(SUPPLIER_KEYS.detail(data.supplierId), data);
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplierApi.delete(id),
    onSuccess: (_, id) => {

      queryClient.removeQueries({ queryKey: SUPPLIER_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
    },
  });
}

export function useRestoreSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplierApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
    },
  });
}
