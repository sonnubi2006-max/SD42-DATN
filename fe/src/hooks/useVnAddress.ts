import { useQuery } from "@tanstack/react-query";
import { vnAddressApi } from "@/api/vnAddressApi";

const DAY = 1000 * 60 * 60 * 24;

export const useProvinces = () =>
  useQuery({
    queryKey: ["vn-address-v2", "provinces"],
    queryFn: vnAddressApi.getProvinces,
    staleTime: DAY,
  });

export const useWardsByProvince = (provinceCode?: number, provinceName?: string) =>
  useQuery({
    queryKey: ["vn-address-v2", "wards-by-province", provinceCode],
    queryFn: () => vnAddressApi.getWardsByProvince(provinceCode!, provinceName),
    enabled: provinceCode != null,
    staleTime: DAY,
  });
