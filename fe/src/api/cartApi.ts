
import axiosInstance from "./axiosInstance";

export interface CartItemResponse {
  cartItemId: number;
  variantId: number;
  productId: number;
  productName: string;
  brandName?: string;
  categoryName?: string;
  sku?: string;
  imageUrl?: string;
  color?: string;
  size?: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  subtotal: number;
}

export interface CartVariant {
  variantId: number;
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  salePrice?: number;
  stockQuantity?: number;
  status?: string;
  image?: { imageUrl?: string } | null;
  product?: { productId?: number; productName?: string; status?: string } | null;
}

export interface CartEntityItem {
  cartItemId: number;
  quantity: number;
  price?: number;
  variant: CartVariant;
  createdAt?: string;
}

export interface CartResponse {
  cartId: number;
  items: CartEntityItem[];
}

export interface CartItemRequest {
  variantId: number;
  quantity: number;
}

const cartApi = {
  getMyCart: async (): Promise<CartResponse> => {
    const { data } = await axiosInstance.get<CartResponse>("/cart");
    return data;
  },

  addItem: async (payload: CartItemRequest): Promise<CartItemResponse> => {
    const { data } = await axiosInstance.post<CartItemResponse>(
      "/cart/items",
      payload,
    );
    return data;
  },

  updateItem: async (payload: CartItemRequest): Promise<CartItemResponse> => {
    const { data } = await axiosInstance.put<CartItemResponse>(
      "/cart/items",
      payload,
    );
    return data;
  },

  increase: async (cartItemId: number): Promise<CartItemResponse> => {
    const { data } = await axiosInstance.patch<CartItemResponse>(
      `/cart/items/${cartItemId}/increase`,
    );
    return data;
  },

  decrease: async (cartItemId: number): Promise<CartItemResponse | null> => {
    const { data } = await axiosInstance.patch<CartItemResponse | null>(
      `/cart/items/${cartItemId}/decrease`,
    );
    return data ?? null;
  },

  removeItem: async (cartItemId: number): Promise<void> => {
    await axiosInstance.delete(`/cart/items/${cartItemId}`);
  },

  removeItems: async (cartItemIds: number[]): Promise<void> => {
    await axiosInstance.delete("/cart/items", { data: cartItemIds });
  },

  clear: async (): Promise<void> => {
    await axiosInstance.delete("/cart");
  },

  count: async (): Promise<number> => {
    const { data } = await axiosInstance.get<number>("/cart/count");
    return data ?? 0;
  },

  total: async (): Promise<number> => {
    const { data } = await axiosInstance.get<number>("/cart/total");
    return data ?? 0;
  },

  exists: async (variantId: number): Promise<boolean> => {
    const { data } = await axiosInstance.get<boolean>(
      `/cart/exists/${variantId}`,
    );
    return !!data;
  },
};

export default cartApi;
