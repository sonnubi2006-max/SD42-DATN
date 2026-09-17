
import axiosInstance from "./axiosInstance";
import { cookieUtil } from "@/utils/cookie";
import useAuthStore from "@/store/authStore";
import type { UserGender } from "./userApi";

export interface User {
  userId: number;
  email: string;
  username: string;
  role: "ADMIN" | "USER" | "STAFF";
  fullName: string;
  phone: string;
  avatar?: string;
  gender?: UserGender;
  birthday?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}
export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  gender: UserGender;
  birthday: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

const saveAuth = (data: AuthTokens) => {
  cookieUtil.setAccessToken(data.accessToken);
  cookieUtil.setRefreshToken(data.refreshToken);
  useAuthStore.getState().setUser(data.user);
};

const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthTokens> => {

    const { data } = await axiosInstance.post<AuthTokens>(
      "/auth/manager/register",
      payload,
    );
    saveAuth(data);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthTokens> => {
    const { data } = await axiosInstance.post<AuthTokens>(
      "/auth/manager/login",
      payload,
    );
    saveAuth(data);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post("/auth/manager/logout", {
        refreshToken: cookieUtil.getRefreshToken(),
      });
    } finally {
      useAuthStore.getState().logout();
    }
  },

  getMe: async (): Promise<User> => {
    const { data } = await axiosInstance.get<User>("/me");
    useAuthStore.getState().setUser(data);
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const { data } = await axiosInstance.put<User>("/profile", payload);
    useAuthStore.getState().setUser(data);
    return data;
  },

  changePassword: async (
    payload: ChangePasswordPayload,
  ): Promise<MessageResponse> => {
    const { data } = await axiosInstance.put<MessageResponse>(
      "/change-password",
      payload,
    );
    return data;
  },

  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<MessageResponse> => {
    const { data } = await axiosInstance.post<MessageResponse>(
      "/auth/manager/forgot-password",
      payload,
    );
    return data;
  },

  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<MessageResponse> => {

    const { data } = await axiosInstance.post<MessageResponse>(
      "/auth/manager/reset-password",
      {
        token: payload.token,
        newPassword: payload.password,
        confirmPassword: payload.confirmPassword,
      },
    );
    return data;
  },

  verifyEmail: async (token: string): Promise<MessageResponse> => {
    const { data } = await axiosInstance.get<MessageResponse>(
      `/verify-email?token=${token}`,
    );
    return data;
  },
};

export default authApi;
