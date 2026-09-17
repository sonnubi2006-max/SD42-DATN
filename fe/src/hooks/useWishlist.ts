import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import wishlistApi, { type WishlistParams } from "@/api/wishlistApi";
import useAuthStore from "@/store/authStore";

export const WISHLIST_KEYS = {
  all: ["wishlist"] as const,
  list: (params?: WishlistParams) => ["wishlist", "list", params] as const,
  count: ["wishlist", "count"] as const,
  exists: (variantId: number) => ["wishlist", "exists", variantId] as const,
};

export function useWishlist(params?: WishlistParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: WISHLIST_KEYS.list(params),
    queryFn: () => wishlistApi.getMyWishlist(params),
    enabled: isAuthenticated,
  });
}

export function useWishlistCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: WISHLIST_KEYS.count,
    queryFn: wishlistApi.count,
    enabled: isAuthenticated,
  });
}

export function useWishlistExists(variantId?: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: WISHLIST_KEYS.exists(variantId ?? 0),
    queryFn: () => wishlistApi.exists(variantId!),
    enabled: isAuthenticated && !!variantId,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) => wishlistApi.toggle(variantId),
    onSuccess: (added) => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
      toast.success(added ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích");
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Thao tác thất bại"),
  });
}

export function useRemoveWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) => wishlistApi.remove(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
      toast.success("Đã bỏ khỏi yêu thích");
    },
  });
}

export function useClearWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => wishlistApi.clear(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all }),
  });
}
