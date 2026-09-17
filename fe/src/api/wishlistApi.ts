
import axiosInstance, { type PageResponse } from "./axiosInstance";

export interface WishlistResponse {
  wishlistId: number;
  productId: number;
  variantId: number;
  productName: string;
  productCode: string;
  productSlug: string;
  imageUrl?: string;
  color?: string;
  size?: string;
  price: number;
  createdAt: string;
  salePrice?: number;
  discountPercentage?: number;
  productStatus?: "ACTIVE" | "INACTIVE";
  variantStatus?: "ACTIVE" | "INACTIVE";
  stockQuantity?: number;
}

export interface WishlistParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
  keyword?: string;
}

const wishlistApi = {
  getMyWishlist: async (
    params?: WishlistParams,
  ): Promise<PageResponse<WishlistResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<WishlistResponse>>(
      "/wishlist",
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 12,
          sort: params?.sort ?? "createdAt",
          direction: params?.direction ?? "desc",
          keyword: params?.keyword ?? "",
        },
      },
    );
    return data;
  },

  add: async (variantId: number): Promise<WishlistResponse> => {
    const { data } = await axiosInstance.post<WishlistResponse>(
      `/wishlist/${variantId}`,
    );
    return data;
  },

  remove: async (variantId: number): Promise<void> => {
    await axiosInstance.delete(`/wishlist/${variantId}`);
  },

  toggle: async (variantId: number): Promise<boolean> => {
    const { data } = await axiosInstance.put<boolean>(
      `/wishlist/${variantId}/toggle`,
    );
    return !!data;
  },

  exists: async (variantId: number): Promise<boolean> => {
    const { data } = await axiosInstance.get<boolean>(
      `/wishlist/${variantId}/exists`,
    );
    return !!data;
  },

  count: async (): Promise<number> => {
    const { data } = await axiosInstance.get<number>("/wishlist/count");
    return data ?? 0;
  },

  clear: async (): Promise<void> => {
    await axiosInstance.delete("/wishlist/clear");
  },
};

export default wishlistApi;
