import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promotionApi } from "@/api/promotionApi";
import type {
  PromotionListParams,
  PromotionPayload,
} from "@/api/promotionApi";

const KEYS = {
  all: ["promotions"] as const,
  list: (params: PromotionListParams) => ["promotions", "list", params] as const,
  detail: (id: number) => ["promotions", "detail", id] as const,
};

export const usePromotionList = (params: PromotionListParams) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => promotionApi.getList(params),
    staleTime: 5 * 60_000,
  });

export const usePromotionById = (id: number) =>
  useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => promotionApi.getById(id),
    enabled: !!id,
  });

export const useCreatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromotionPayload) => promotionApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useUpdatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PromotionPayload }) =>
      promotionApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};

export const useCancelPromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => promotionApi.cancel(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};

export const useTogglePromotionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => promotionApi.toggleStatus(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};
