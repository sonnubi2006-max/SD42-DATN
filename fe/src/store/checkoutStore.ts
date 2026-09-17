import { create } from "zustand";
import type { CartEntityItem } from "@/api/cartApi";

export interface CheckoutCartItem {
  cartItemId: number;
  variantId: number;
  productId?: number;
  productName: string;
  imageUrl?: string;
  color?: string;
  size?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  stockQuantity: number;
}

interface CheckoutState {
  items: CheckoutCartItem[];
  setItems: (items: CheckoutCartItem[]) => void;
  updatePrices: (prices: Array<{ variantId: number; price: number; originalPrice?: number }>) => void;
  clear: () => void;
}

function effectivePrice(item: CartEntityItem): number {
  const salePrice = item.variant?.salePrice ?? 0;
  return salePrice > 0 ? salePrice : (item.variant?.price ?? 0);
}

export function toCheckoutItem(item: CartEntityItem): CheckoutCartItem {
  const variant = item.variant;
  return {
    cartItemId: item.cartItemId,
    variantId: variant.variantId,
    productId: variant.product?.productId,
    productName: variant.product?.productName ?? "Sản phẩm",
    imageUrl: variant.image?.imageUrl,
    color: variant.color,
    size: variant.size,
    price: effectivePrice(item),
    originalPrice: variant?.price ?? 0,
    quantity: item.quantity,
    stockQuantity: variant.stockQuantity ?? 0,
  };
}

const useCheckoutStore = create<CheckoutState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  updatePrices: (prices) =>
    set((state) => ({
      items: state.items.map((item) => {
        const changed = prices.find((price) => price.variantId === item.variantId);
        return changed
          ? { ...item, price: changed.price, originalPrice: changed.originalPrice ?? item.originalPrice }
          : item;
      }),
    })),
  clear: () => set({ items: [] }),
}));

export default useCheckoutStore;
