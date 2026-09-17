import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import cartApi, { type CartItemRequest } from "@/api/cartApi";
import useAuthStore from "@/store/authStore";

export const CART_KEYS = {
  all: ["cart"] as const,
  detail: ["cart", "detail"] as const,
  count: ["cart", "count"] as const,
  total: ["cart", "total"] as const,
};

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: CART_KEYS.detail,
    queryFn: cartApi.getMyCart,
    enabled: isAuthenticated,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useCartCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: CART_KEYS.count,
    queryFn: cartApi.count,
    enabled: isAuthenticated,
  });
}

export function useCartTotal() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: CART_KEYS.total,
    queryFn: cartApi.total,
    enabled: isAuthenticated,
  });
}

function useInvalidateCart() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
}

export function useAddToCart() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: (payload: CartItemRequest) => cartApi.addItem(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Đã thêm vào giỏ hàng");
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Không thể thêm vào giỏ hàng"),
  });
}

export function useUpdateCartItem() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: (payload: CartItemRequest) => cartApi.updateItem(payload),
    onSuccess: invalidate,
    onError: (err: { apiMessage?: string }) => {
      invalidate();
      toast.error(err.apiMessage ?? "Không thể cập nhật số lượng");
    },
  });
}

export function useIncreaseCartItem() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: (cartItemId: number) => cartApi.increase(cartItemId),
    onSuccess: invalidate,
    onError: (err: { apiMessage?: string }) => {
      invalidate();
      toast.error(err.apiMessage ?? "Không thể tăng số lượng");
    },
  });
}

export function useDecreaseCartItem() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: (cartItemId: number) => cartApi.decrease(cartItemId),
    onSuccess: invalidate,
  });
}

export function useRemoveCartItem() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: (cartItemId: number) => cartApi.removeItem(cartItemId),
    onSuccess: () => {
      invalidate();
      toast.success("Đã xoá sản phẩm khỏi giỏ");
    },
  });
}

export function useClearCart() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: invalidate,
  });
}
