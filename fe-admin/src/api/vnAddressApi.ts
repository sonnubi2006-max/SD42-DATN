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

export interface ResolvedV2Address {
  provinceCode: number;
  province: string;
  wardCode: string;
  ward: string;
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

  resolveLegacyAddress: (
    ward: string,
    district: string,
    province: string,
  ): Promise<ResolvedV2Address | null> =>
    axios
      .get<ApiEnvelope<Partial<ResolvedV2Address>> | Partial<ResolvedV2Address>>(
        `${BACKEND}/shipping/address/resolve-v2`,
        { params: { ward, district, province } },
      )
      .then((res) => {
        const data = "data" in res.data ? res.data.data : res.data;
        if (!data?.provinceCode || !data.province || !data.wardCode || !data.ward) return null;
        return {
          provinceCode: Number(data.provinceCode),
          province: data.province,
          wardCode: String(data.wardCode),
          ward: data.ward,
        };
      }),

};
