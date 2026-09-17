
import axiosInstance from "./axiosInstance";

export interface AddressRequest {
  consigneeName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  ghnProvinceId?: number;
  ghnDistrictId?: number;
  ghnWardCode?: string;
  streetAddress: string;
  isDefault?: boolean;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
}

export interface AddressResponse {
  addressId: number;
  consigneeName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  ghnProvinceId?: number;
  ghnDistrictId?: number;
  ghnWardCode?: string;
  streetAddress: string;
  isDefault: boolean;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
}

const addressApi = {
  getMyAddresses: async (): Promise<AddressResponse[]> => {
    const { data } = await axiosInstance.get<AddressResponse[]>(
      "/users/addresses",
    );
    return data;
  },

  getDefault: async (): Promise<AddressResponse | null> => {
    const { data } = await axiosInstance.get<AddressResponse | null>(
      "/users/addresses/default",
    );
    return data ?? null;
  },

  getById: async (addressId: number): Promise<AddressResponse> => {
    const { data } = await axiosInstance.get<AddressResponse>(
      `/addresses/${addressId}`,
    );
    return data;
  },

  create: async (payload: AddressRequest): Promise<AddressResponse> => {
    const { data } = await axiosInstance.post<AddressResponse>(
      "/users/addresses",
      payload,
    );
    return data;
  },

  update: async (
    addressId: number,
    payload: AddressRequest,
  ): Promise<AddressResponse> => {
    const { data } = await axiosInstance.put<AddressResponse>(
      `/addresses/${addressId}`,
      payload,
    );
    return data;
  },

  setDefault: async (addressId: number): Promise<void> => {
    await axiosInstance.patch(`/users/addresses/${addressId}/default`);
  },

  remove: async (addressId: number): Promise<void> => {
    await axiosInstance.delete(`/addresses/${addressId}`);
  },
};

export default addressApi;
