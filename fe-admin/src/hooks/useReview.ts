import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewApi, type ReviewFilterParams } from "@/api/reviewApi";
import { toast } from "sonner";

export const REVIEW_KEYS = {
  all: ["admin-reviews"] as const,
  filter: (p?: ReviewFilterParams) => ["admin-reviews", "filter", p] as const,
};

export function useAdminReviews(params?: ReviewFilterParams) {
  return useQuery({
    queryKey: REVIEW_KEYS.filter(params),
    queryFn: () => reviewApi.filterReviews(params),
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
      toast.success("Đã phê duyệt đánh giá thành công");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Phê duyệt thất bại");
    },
  });
}

export function useRejectReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
      toast.success("Đã từ chối đánh giá thành công");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Từ chối thất bại");
    },
  });
}

export function useHideReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewApi.hide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
      toast.success("Đã ẩn đánh giá thành công");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Ẩn thất bại");
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
      toast.success("Đã xóa đánh giá thành công");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Xóa đánh giá thất bại");
    },
  });
}
