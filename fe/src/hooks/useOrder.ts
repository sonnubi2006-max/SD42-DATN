import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import orderApi, {
  type CreateOrderRequest,
  type OrderFilterParams,
} from "@/api/orderApi";
import { CART_KEYS } from "./useCart";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  list: (params?: OrderFilterParams) => ["orders", "list", params] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
};

export function useMyOrders(params?: OrderFilterParams) {
  return useQuery({
    queryKey: ORDER_KEYS.list(params),
    queryFn: () => orderApi.getMyOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyOrdersInfinite(params?: Omit<OrderFilterParams, "page">) {
  return useInfiniteQuery({
    queryKey: [...ORDER_KEYS.list(params), "infinite"],
    queryFn: ({ pageParam = 0 }) =>
      orderApi.getMyOrders({ ...params, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.number + 1;
      return nextPage < lastPage.totalPages ? nextPage : undefined;
    },
  });
}

export function useOrder(orderId?: number) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(orderId ?? 0),
    queryFn: () => orderApi.getById(orderId!),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => orderApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (err: { apiMessage?: string; apiDetails?: unknown }) =>
      toast.error(err.apiMessage ?? "Đặt hàng thất bại"),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason?: string }) =>
      orderApi.cancel(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      toast.success("Đã huỷ đơn hàng");
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Không thể huỷ đơn hàng"),
  });
}
