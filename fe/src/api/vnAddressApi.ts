import axiosInstance from "./axiosInstance";
import axios from "axios";

const BACKEND = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8080/api/v1";

export interface VnProvince {
  code: number;
  name: string;
}

export interface GhnWardFull {

  wardCode: string;

  wardName: string;

  districtId: number;

  districtName: string;

  ghnProvinceId?: number;

  ghnWardCode?: string;
}

interface OpenApiProvinceRaw {
  code: number;
  name: string;
}

interface WardMappingRaw {
  code?: number | string;
  name?: string;
  provinceId?: number | string;
  districtId?: number | string;
  districtName?: string;
  wardCode?: number | string;
}

interface ApiEnvelope<T> {
  data: T;
}

export const vnAddressApi = {

  getProvinces: (): Promise<VnProvince[]> =>
    axios.get<ApiEnvelope<OpenApiProvinceRaw[]> | OpenApiProvinceRaw[]>(
      `${BACKEND}/shipping/ghn/provinces-v2`,
    )
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.data ?? [];
        return list.map((p) => ({
          code: Number(p.code),
          name: p.name,
        }));
      }),

  getWardsByProvince: (provinceCode: number, provinceName?: string): Promise<GhnWardFull[]> =>
    axios.get<ApiEnvelope<WardMappingRaw[]> | WardMappingRaw[]>(`${BACKEND}/shipping/ghn/wards-v2`, {
      params: { provinceCode, provinceName }
    })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.data ?? [];
        return list.map((w) => {
          const openApiCode = String(w.code ?? "");
          const ghnCode = w.wardCode ? String(w.wardCode) : undefined;
          return {
            wardCode: openApiCode,
            wardName: w.name ?? "",
            districtId: Number(w.districtId ?? 0),
            districtName: w.districtName ?? "",
            ghnProvinceId: Number(w.provinceId ?? 0) || undefined,
            ghnWardCode: ghnCode,
          };
        });
      }),

  calculateShippingFee: (params: { toDistrictId: number; toWardCode: string; weight?: number }): Promise<number> =>
    axiosInstance.get<number>("/shipping/ghn/fee", { params }).then((res) => res.data),

};
