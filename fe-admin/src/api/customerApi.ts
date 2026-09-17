import axiosInstance from "./axiosInstance";
import type { PageResponse } from "./axiosInstance";

export type CustomerSource = "GUEST" | "REGISTERED";
export type CustomerStatus = "ACTIVE" | "INACTIVE";
export type CustomerGender = "MALE" | "FEMALE";

export interface CustomerResponse {
  customerId: number;
  customerCode: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  gender: string | null;
  birthday: string | null;
  avatar: string | null;
  source: CustomerSource;
  status: CustomerStatus;
  emailSubscribed: boolean;
  hasAccount: boolean;
  address?: AddressResponse;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerStatistics {
  total: number;
  guest: number;
  registered: number;
}

export interface CustomerListParams {
  keyword?: string;
  status?: CustomerStatus;
  source?: CustomerSource;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface CustomerRequest {
  email?: string;
  fullName?: string;
  phone?: string;
  gender?: CustomerGender;
  birthday?: string;
  avatar?: string;
  emailSubscribed?: boolean;
}

export interface AddressResponse {
  addressId: number;
  consigneeName: string | null;
  phone: string | null;
  province: string | null;
  district: string | null;
  ward: string | null;
  ghnProvinceId?: number;
  ghnDistrictId?: number;
  ghnWardCode?: string;
  streetAddress: string | null;
  isDefault: boolean;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
}

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

const BASE_URL = "/manager/customers";

export const customerApi = {
  getList: (params: CustomerListParams) =>
    axiosInstance
      .get<PageResponse<CustomerResponse>>(BASE_URL, { params })
      .then((r) => r.data),

  getById: (id: number) =>
    axiosInstance.get<CustomerResponse>(`${BASE_URL}/${id}`).then((r) => r.data),

  create: (payload: CustomerRequest) =>
    axiosInstance.post<CustomerResponse>(BASE_URL, payload).then((r) => r.data),

  update: (id: number, payload: CustomerRequest) =>
    axiosInstance
      .put<CustomerResponse>(`${BASE_URL}/${id}`, payload)
      .then((r) => r.data),

  setStatus: (id: number, status: CustomerStatus) =>
    axiosInstance
      .patch(`${BASE_URL}/${id}/status`, null, { params: { status } })
      .then((r) => r.data),

  getStatistics: () =>
    axiosInstance
      .get<CustomerStatistics>(`${BASE_URL}/statistics`)
      .then((r) => r.data),

  getAddresses: (id: number) =>
    axiosInstance
      .get<AddressResponse[]>(`${BASE_URL}/${id}/addresses`)
      .then((r) => r.data),

  setDefaultAddress: (id: number, addressId: number) =>
    axiosInstance
      .patch(`${BASE_URL}/${id}/addresses/${addressId}/default`)
      .then((r) => r.data),

  createAddress: (id: number, payload: AddressRequest) =>
    axiosInstance
      .post<AddressResponse>(`${BASE_URL}/${id}/addresses`, payload)
      .then((r) => r.data),

  updateAddress: (id: number, addressId: number, payload: AddressRequest) =>
    axiosInstance
      .put<AddressResponse>(`${BASE_URL}/${id}/addresses/${addressId}`, payload)
      .then((r) => r.data),

  deleteAddress: (id: number, addressId: number) =>
    axiosInstance
      .delete(`${BASE_URL}/${id}/addresses/${addressId}`)
      .then((r) => r.data),

  searchForPos: (keyword?: string) =>
    axiosInstance
      .get<CustomerResponse[]>(`${BASE_URL}/search`, { params: { keyword } })
      .then((r) => r.data),
};
