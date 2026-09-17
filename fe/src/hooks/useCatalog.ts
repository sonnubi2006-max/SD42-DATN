import { keepPreviousData, useQuery } from "@tanstack/react-query";
import productApi, { type ProductFilterParams } from "@/api/productApi";
import categoryApi from "@/api/categoryApi";
import brandApi from "@/api/brandApi";
import bannerApi, { type BannerParams } from "@/api/bannerApi";
import promotionApi from "@/api/promotionApi";
import couponApi from "@/api/couponApi";

export const CATALOG_KEYS = {
  products: (params?: ProductFilterParams) =>
    ["products", "list", params] as const,
  product: (id: number) => ["products", "detail", id] as const,
  productByCode: (code: string) => ["products", "detail", "code", code] as const,
  topRated: (limit: number) => ["products", "top-rated", limit] as const,
  bestSellers: (limit: number) => ["products", "best-sellers", limit] as const,
  categories: ["categories"] as const,
  brands: ["brands"] as const,
  banners: ["banners"] as const,
  activePromotions: ["promotions", "active"] as const,
  activeCoupons: ["coupons", "active"] as const,
  priceRange: ["products", "price-range"] as const,
};

export function useProducts(params?: ProductFilterParams) {
  return useQuery({
    queryKey: CATALOG_KEYS.products(params),
    queryFn: () => productApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProduct(id?: number) {
  return useQuery({
    queryKey: CATALOG_KEYS.product(id ?? 0),
    queryFn: () => productApi.getById(id!),
    enabled: !!id,
  });
}

export function useProductByCode(productCode?: string) {
  return useQuery({
    queryKey: CATALOG_KEYS.productByCode(productCode ?? ""),
    queryFn: () => productApi.getByCode(productCode!),
    enabled: Boolean(productCode),
  });
}

export function useTopRatedProducts(limit = 8) {
  return useQuery({
    queryKey: CATALOG_KEYS.topRated(limit),
    queryFn: () => productApi.getTopRated(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBestSellers(limit = 8) {
  return useQuery({
    queryKey: CATALOG_KEYS.bestSellers(limit),
    queryFn: () => productApi.getBestSellers(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: CATALOG_KEYS.categories,
    queryFn: () => categoryApi.getAll(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: CATALOG_KEYS.brands,
    queryFn: () => brandApi.getAll(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useBanners(params?: BannerParams) {
  return useQuery({
    queryKey: [...CATALOG_KEYS.banners, params],
    queryFn: () => bannerApi.getAll(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useActivePromotions() {
  return useQuery({
    queryKey: CATALOG_KEYS.activePromotions,
    queryFn: () => promotionApi.getActive(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useActiveCoupons() {
  return useQuery({
    queryKey: CATALOG_KEYS.activeCoupons,
    queryFn: () => couponApi.getActiveCoupons(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProductPriceRange() {
  return useQuery({
    queryKey: CATALOG_KEYS.priceRange,
    queryFn: () => productApi.getPriceRange(),
    staleTime: 1000 * 60 * 10,
  });
}
