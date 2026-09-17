import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponApi } from "@/api/couponApi";
import type {
  CouponListParams,
  CouponPayload,
  CouponStatus,
  ValidateCouponPayload,
} from "@/api/couponApi";

const KEYS = {
  all: ["coupons"] as const,
  list: (params: CouponListParams) => ["coupons", "list", params] as const,
  detail: (id: number) => ["coupons", "detail", id] as const,
};

export const useCouponList = (params: CouponListParams) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => couponApi.getList(params),
    staleTime: 5 * 60_000,
  });

export const useCouponById = (id: number) =>
  useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => couponApi.getById(id),
    enabled: !!id,
  });

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CouponPayload) => couponApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CouponPayload }) =>
      couponApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};

export const useSetCouponStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: CouponStatus }) =>
      couponApi.setStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};

export const useValidateCoupon = () =>
  useMutation({
    mutationFn: (payload: ValidateCouponPayload) => couponApi.validate(payload),
  });
