import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posApi } from "@/api/posApi";
import type {
  PosAddItemRequest,
  PosAttachCustomerRequest,
  PosCheckoutRequest,
  PosUpdateItemRequest,
} from "@/api/posApi";

const KEYS = {
  all: ["pos-drafts"] as const,
  drafts: () => ["pos-drafts", "list"] as const,
  detail: (id: number) => ["pos-drafts", "detail", id] as const,
};

export function usePosDrafts() {
  return useQuery({
    queryKey: KEYS.drafts(),
    queryFn: () => posApi.getDrafts(),
    staleTime: 3000,
    refetchInterval: 1000 * 60 * 10,
  });
}

export function usePosDraftDetail(id: number | null) {
  return useQuery({
    queryKey: KEYS.detail(id!),
    queryFn: () => posApi.getDraftById(id!),
    enabled: id !== null,
    staleTime: 2000,
  });
}

export function useCreatePosDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: { shiftId?: number }) => posApi.createDraft(request),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useCancelPosDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => posApi.cancelDraft(orderId),
    onSuccess: (_, orderId) => {
      qc.setQueryData(KEYS.drafts(), (old: any) => {
        if (!old) return old;
        return old.filter((d: any) => d.orderId !== orderId);
      });
      qc.removeQueries({ queryKey: KEYS.detail(orderId) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useAddPosItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      request,
    }: {
      orderId: number;
      request: PosAddItemRequest;
    }) => posApi.addItem(orderId, request),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(orderId) });
      qc.invalidateQueries({ queryKey: KEYS.drafts() });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdatePosItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      detailId,
      request,
    }: {
      orderId: number;
      detailId: number;
      request: PosUpdateItemRequest;
    }) => posApi.updateItem(orderId, detailId, request),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(orderId) });
      qc.invalidateQueries({ queryKey: KEYS.drafts() });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRemovePosItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      detailId,
    }: {
      orderId: number;
      detailId: number;
    }) => posApi.removeItem(orderId, detailId),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(orderId) });
      qc.invalidateQueries({ queryKey: KEYS.drafts() });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAttachPosCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      request,
    }: {
      orderId: number;
      request: PosAttachCustomerRequest;
    }) => posApi.attachCustomer(orderId, request),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(orderId) });
      qc.invalidateQueries({ queryKey: KEYS.drafts() });
    },
  });
}

export function useCheckoutPos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      request,
    }: {
      orderId: number;
      request: PosCheckoutRequest;
    }) => posApi.checkout(orderId, request),
    onSuccess: (_, { orderId }) => {

      qc.setQueryData(KEYS.drafts(), (old: any) => {
        if (!old) return old;
        return old.filter((d: any) => d.orderId !== orderId);
      });
      qc.removeQueries({ queryKey: KEYS.detail(orderId) });

      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}
