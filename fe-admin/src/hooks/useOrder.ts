import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { orderApi } from "@/api/orderApi";
import type {
  OrderSearchParams,
  OrderStatus,
  CreatePosOrderRequest,
} from "@/api/orderApi";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  list: (params: OrderSearchParams) => ["orders", "list", params] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
  statistics: () => ["orders", "statistics"] as const,
  topRatedProducts: (params?: { fromDate?: string; toDate?: string }) =>
    ["orders", "top-rated-products", params] as const,
};

export function useOrderList(params: OrderSearchParams) {
  return useQuery({
    queryKey: ORDER_KEYS.list(params),
    queryFn: () => orderApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 5000,
  });
}

export function useOrderDetail(id: number | null) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id!),
    queryFn: () => orderApi.getById(id!),
    enabled: id !== null,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        status: OrderStatus;
        note?: string;
        damagedItems?: { variantId: number; damagedQuantity: number }[];
        images?: File[];
      };
    }) => orderApi.updateStatus(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
      qc.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.id) });

      qc.invalidateQueries({ queryKey: ["returns"] });
    },
  });
}

export function useCreatePosOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreatePosOrderRequest) =>
      orderApi.createPosOrder(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all });
      qc.invalidateQueries({ queryKey: ORDER_KEYS.statistics() });

      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useOrderStatistics(params?: { fromDate?: string; toDate?: string }) {
  return useQuery({
    queryKey: [...ORDER_KEYS.statistics(), params],
    queryFn: () => orderApi.getStatistics(params),
  });
}

export function useTopRatedProductStatistics(
  params?: { fromDate?: string; toDate?: string },
) {
  return useQuery({
    queryKey: ORDER_KEYS.topRatedProducts(params),
    queryFn: () => orderApi.getTopRatedProductStatistics(params, 5),
  });
}
