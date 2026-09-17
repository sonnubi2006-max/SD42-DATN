import type { PageResponse } from "@/api/couponApi";
import axiosInstance from "./axiosInstance";

export type UserStatus = "ACTIVE" | "INACTIVE";
export type UserRole = "ADMIN" | "STAFF";
export type UserGender = "MALE" | "FEMALE";

export interface UserResponse {
  userId: number;
  userCode: string;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  avatar: string;
  gender: UserGender;
  birthday: string;
  status: UserStatus;
  cccd: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
}

export interface UserListParams {
  keyword?: string;
  status?: UserStatus | null;
  role?: UserRole | null;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface CreateStaffPayload {

  email: string;
  phone: string;
  fullName: string;
  role: "STAFF" | "ADMIN";
  gender: UserGender;
  cccd: string;
  birthday: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  file?: File;
}

export interface UpdateRolePayload {
  role: UserRole;
}
export interface UpdateUserPayload {
  phone: string;
  fullName: string;
  avatar: string;
  gender: UserGender;
  birthday: string;
  status: UserStatus;
  cccd: string;
  role: UserRole;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  file?: File;
}
export interface ResetPasswordPayload {
  newPassword: string;
}

export interface UserStatisticProjection {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  bannedUsers: number;
  staffUsers: number;
  adminUsers: number;
}

const BASE = "/admin/users";

export const userApi = {
  getList: (params: UserListParams) =>
    axiosInstance
      .get<PageResponse<UserResponse>>("/manager/users", { params })
      .then((r) => r.data),

  getById: (id: number) =>
    axiosInstance.get<UserResponse>(`${BASE}/${id}`).then((r) => r.data),

  createStaff: (payload: CreateStaffPayload) => {
    const formData = new FormData();
    formData.append("email", payload.email);
    formData.append("phone", payload.phone);
    formData.append("fullName", payload.fullName);
    formData.append("role", payload.role);
    formData.append("gender", payload.gender);
    formData.append("birthday", payload.birthday);
    formData.append("cccd", payload.cccd);

    formData.append("province", payload.province);
    formData.append("district", payload.district);
    formData.append("ward", payload.ward);
    formData.append("streetAddress", payload.streetAddress);

    if (payload.file) {
      formData.append("file", payload.file);
    }

    return axiosInstance
      .post<UserResponse>(BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  updateRole: (id: number, payload: UpdateRolePayload) =>
    axiosInstance
      .put<UserResponse>(`${BASE}/${id}`, payload)
      .then((r) => r.data),

  updateStatus: (id: number) =>
    axiosInstance.put<UserResponse>(`${BASE}/${id}/status`).then((r) => r.data),
  updateUser: (id: number, payload: UpdateUserPayload) => {
    const formData = new FormData();
    formData.append("phone", payload.phone);
    formData.append("fullName", payload.fullName);
    formData.append("role", payload.role);
    formData.append("gender", payload.gender);
    formData.append("birthday", payload.birthday);
    formData.append("status", payload.status);
    formData.append("cccd", payload.cccd);

    formData.append("province", payload.province);
    formData.append("district", payload.district);
    formData.append("ward", payload.ward);
    formData.append("streetAddress", payload.streetAddress);

    if (payload.file) {
      formData.append("file", payload.file);
    }

    return axiosInstance
      .put<UserResponse>(`${BASE}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  resetPassword: (id: number, payload: ResetPasswordPayload) =>
    axiosInstance
      .put(`${BASE}/${id}/reset-password`, payload)
      .then((r) => r.data),
  export: (params: UserListParams, ids?: number[]): Promise<Blob> => {
    const sp = new URLSearchParams();
    if (params.keyword) sp.append("keyword", params.keyword);
    if (params.status) sp.append("status", params.status);
    if (params.role) sp.append("role", params.role);
    if (ids) ids.forEach((id) => sp.append("ids", String(id)));
    return axiosInstance
      .get(`/admin/users/export?${sp.toString()}`, {
        responseType: "blob",
      })
      .then((res) => res.data as Blob);
  },

  getUserStatistics: () =>
    axiosInstance
      .get<UserStatisticProjection>(`${BASE}/statistics`)
      .then((r) => r.data),
};
