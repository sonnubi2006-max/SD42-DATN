import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import reviewApi, {
  type CreateReviewRequest,
  type ReviewParams,
  type UpdateReviewRequest,
} from "@/api/reviewApi";

export const REVIEW_KEYS = {
  all: ["reviews"] as const,
  byProduct: (productId: number, params?: ReviewParams) =>
    ["reviews", "product", productId, params] as const,
  summary: (productId: number) => ["reviews", "summary", productId] as const,
  my: (params?: ReviewParams) => ["reviews", "my", params] as const,
  unreviewed: (params?: ReviewParams) =>
    ["reviews", "unreviewed", params] as const,
};

export function useProductReviews(productId?: number, params?: ReviewParams) {
  return useQuery({
    queryKey: REVIEW_KEYS.byProduct(productId ?? 0, params),
    queryFn: () => reviewApi.getByProduct(productId!, params),
    enabled: !!productId,
    placeholderData: keepPreviousData,
  });
}

export function useReviewSummary(productId?: number) {
  return useQuery({
    queryKey: REVIEW_KEYS.summary(productId ?? 0),
    queryFn: () => reviewApi.getSummary(productId!),
    enabled: !!productId,
  });
}

export function useMyReviews(params?: ReviewParams) {
  return useQuery({
    queryKey: REVIEW_KEYS.my(params),
    queryFn: () => reviewApi.getMyReviews(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyUnreviewedProducts(params?: ReviewParams) {
  return useQuery({
    queryKey: REVIEW_KEYS.unreviewed(params),
    queryFn: () => reviewApi.getMyUnreviewedProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      files,
    }: {
      payload: CreateReviewRequest;
      files?: File[];
    }) => reviewApi.create(payload, files),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
      if (review.status === "HIDDEN") {
        toast.warning("Đánh giá chứa từ không phù hợp và đã được ẩn");
      } else if (review.status === "PENDING") {
        toast.info("Đánh giá có nội dung nhạy cảm và đang chờ quản trị viên duyệt");
      } else {
        toast.success("Đánh giá đã được đăng tự động");
      }
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Gửi đánh giá thất bại"),
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      files,
    }: {
      id: number;
      payload: UpdateReviewRequest;
      files?: File[];
    }) => reviewApi.update(id, payload, files),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
      if (review.status === "HIDDEN") {
        toast.warning("Đánh giá chứa từ không phù hợp và đã được ẩn");
      } else if (review.status === "PENDING") {
        toast.info("Đánh giá đã chuyển sang chờ duyệt do có nội dung nhạy cảm");
      } else {
        toast.success("Đã cập nhật và đăng đánh giá");
      }
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
      toast.success("Đã xoá đánh giá");
    },
  });
}
