
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import returnApi, {
  type CreateReturnRequest,
  type ReturnFilterParams,
} from "@/api/returnApi";
import { ORDER_KEYS } from "./useOrder";

export const RETURN_KEYS = {
  all: ["returns"] as const,
  list: (params?: ReturnFilterParams) => ["returns", "list", params] as const,
  detail: (id: number) => ["returns", "detail", id] as const,
};

export function useMyReturns(params?: ReturnFilterParams) {
  return useQuery({
    queryKey: RETURN_KEYS.list(params),
    queryFn: () => returnApi.getMyReturns(params),
  });
}

export function useReturnDetail(id: number) {
  return useQuery({
    queryKey: RETURN_KEYS.detail(id),
    queryFn: () => returnApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReturnRequest) => returnApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      toast.success("Gửi yêu cầu đổi hàng thành công!");
    },
    onError: (err: { apiMessage?: string }) => {
      toast.error(err.apiMessage ?? "Gửi yêu cầu đổi hàng thất bại");
    },
  });
}
