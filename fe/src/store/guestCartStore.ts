import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CheckoutCartItem } from "./checkoutStore";

interface GuestCartState {
  items: CheckoutCartItem[];
  addItem: (item: CheckoutCartItem) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  removeItems: (variantIds: number[]) => void;
  clear: () => void;
}

const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (cartItem) => cartItem.variantId === item.variantId,
          );
          if (!existing) return { items: [...state.items, item] };

          const quantity = Math.min(
            existing.quantity + item.quantity,
            item.stockQuantity,
          );
          return {
            items: state.items.map((cartItem) =>
              cartItem.variantId === item.variantId
                ? { ...cartItem, ...item, quantity }
                : cartItem,
            ),
          };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.max(
                    1,
                    Math.min(quantity, item.stockQuantity),
                  ),
                }
              : item,
          ),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      removeItems: (variantIds) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !variantIds.includes(item.variantId),
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "stravo-guest-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useGuestCartStore;
