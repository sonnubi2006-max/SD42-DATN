import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import bannerApi from "../api/bannerApi";
import type {
  BannerParams,
  CreateBannerRequest,
  UpdateBannerRequest,
} from "../api/bannerApi";

export const BANNER_KEYS = {
  all: ["banners"] as const,
  list: (params?: BannerParams) => ["banners", "list", params] as const,
  detail: (id: number) => ["banners", "detail", id] as const,
  statictis: () => ["banners"] as const,
};

export function useBannerList(params?: BannerParams) {
  return useQuery({
    queryKey: BANNER_KEYS.list(params),
    queryFn: () => bannerApi.getAll(params),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export function useBannerDetail(id: number) {
  return useQuery({
    queryKey: BANNER_KEYS.detail(id),
    queryFn: () => bannerApi.getById(id),
    enabled: !!id,
  });
}

export function useBannerStatistics() {
  return useQuery({
    queryKey: BANNER_KEYS.statictis(),
    queryFn: () => bannerApi.getBannerStatistics(),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBannerRequest) => bannerApi.create(payload),
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.all });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateBannerRequest;
    }) => bannerApi.update(id, payload),
    onSuccess: (data) => {

      queryClient.setQueryData(BANNER_KEYS.detail(data.bannerId), data);
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.all });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bannerApi.delete(id),
    onSuccess: (_, id) => {

      queryClient.removeQueries({ queryKey: BANNER_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.all });
    },
  });
}
