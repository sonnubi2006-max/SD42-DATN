
import axiosInstance, { type PageResponse } from "./axiosInstance";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DELETED";
export type ProductVariantStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export interface CategoryResponse {
  categoryId: number;
  categoryName: string;
  categoryDescription?: string;
}

export interface BrandResponse {
  brandId: number;
  brandLogo?: string;
  brandName: string;
}

export interface ProductImageResponse {
  imageId: number;
  imageUrl: string;
  isThumbnail: boolean;
}

export interface ProductVariantResponse {
  variantId: number;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  availableStock?: number;
  reservedQuantity: number;
  weight?: number;
  image?: ProductImageResponse;
  createdAt?: string;
  status: ProductVariantStatus;
}

export interface ProductResponse {
  productId: number;
  productName: string;
  productCode: string;
  productSlug: string;
  description?: string;
  averageRating?: number;
  category?: CategoryResponse;
  brand?: BrandResponse;
  status: ProductStatus;
  images: ProductImageResponse[];
  variants: ProductVariantResponse[];
  totalSold?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilterParams {
  page?: number;
  size?: number;
  sort?: string; 
  categoryId?: number | null;
  brandId?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  keyword?: string;
}

export interface PriceRangeResponse {
  min: number;
  max: number;
}

const buildParams = (params?: ProductFilterParams) => {
  const sp: Record<string, string | number> = {
    page: params?.page ?? 0,
    size: params?.size ?? 12,
    sort: params?.sort ?? "createdAt,desc",
  };
  if (params?.categoryId) sp.categoryId = params.categoryId;
  if (params?.brandId) sp.brandId = params.brandId;
  if (params?.minPrice != null) sp.minPrice = params.minPrice;
  if (params?.maxPrice != null) sp.maxPrice = params.maxPrice;
  if (params?.keyword) sp.keyword = params.keyword;
  return sp;
};

const productApi = {
  getAll: async (
    params?: ProductFilterParams,
  ): Promise<PageResponse<ProductResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ProductResponse>>(
      "/products",
      { params: buildParams(params) },
    );
    return data;
  },

  getById: async (id: number): Promise<ProductResponse> => {
    const { data } = await axiosInstance.get<ProductResponse>(
      `/products/${id}`,
    );
    return data;
  },

  getByCode: async (productCode: string): Promise<ProductResponse> => {
    const { data } = await axiosInstance.get<ProductResponse>(
      `/products/code/${encodeURIComponent(productCode)}`,
    );
    return data;
  },

  getTopRated: async (limit = 8): Promise<ProductResponse[]> => {
    const { data } = await axiosInstance.get<ProductResponse[]>(
      "/products/top-rated",
      { params: { limit } },
    );
    return data;
  },

  getBestSellers: async (limit = 8): Promise<ProductResponse[]> => {
    const { data } = await axiosInstance.get<ProductResponse[]>(
      "/products/best-sellers",
      { params: { limit } },
    );
    return data;
  },

  getVariants: async (productId: number): Promise<ProductVariantResponse[]> => {
    const { data } = await axiosInstance.get<ProductVariantResponse[]>(
      `/products/${productId}/variants`,
    );
    return data;
  },

  getPriceRange: async (): Promise<PriceRangeResponse> => {
    const { data } = await axiosInstance.get<PriceRangeResponse>(
      "/products/price-range",
    );
    return data;
  },
};

export function variantEffectivePrice(v: ProductVariantResponse): number {
  return v.salePrice && v.salePrice > 0 ? v.salePrice : v.price;
}

export function productMinPrice(p: ProductResponse): number | null {
  const prices = (p.variants ?? [])
    .filter((v) => v.status === "ACTIVE")
    .map(variantEffectivePrice);
  return prices.length ? Math.min(...prices) : null;
}

export function productMaxPrice(p: ProductResponse): number | null {
  const prices = (p.variants ?? [])
    .filter((v) => v.status === "ACTIVE")
    .map(variantEffectivePrice);
  return prices.length ? Math.max(...prices) : null;
}

export function productOriginalPrice(p: ProductResponse): number | null {
  const prices = (p.variants ?? [])
    .filter((v) => v.status === "ACTIVE")
    .map((v) => v.price);
  return prices.length ? Math.min(...prices) : null;
}

export function productMaxOriginalPrice(p: ProductResponse): number | null {
  const prices = (p.variants ?? [])
    .filter((v) => v.status === "ACTIVE")
    .map((v) => v.price);
  return prices.length ? Math.max(...prices) : null;
}

export function productThumbnail(p: ProductResponse): string | undefined {
  const thumb = (p.images ?? []).find((i) => i.isThumbnail) ?? p.images?.[0];
  return thumb?.imageUrl ?? p.variants?.[0]?.image?.imageUrl;
}

export default productApi;
