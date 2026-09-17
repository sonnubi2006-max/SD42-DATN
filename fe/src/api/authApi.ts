
import axiosInstance from "./axiosInstance";
import { cookieUtil } from "@/utils/cookie";
import useAuthStore from "@/store/authStore";

export type UserRole = "ADMIN" | "USER" | "STAFF";

export interface User {
  userId?: number | string;
  customerId?: number;
  fullName?: string;
  gender?: string;
  phone?: string;
  birthday?: string;
  email?: string;
  role?: UserRole;
  username?: string;
  avatar?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  avatar?: string;
  gender?: Gender;
  birthday?: string; 
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  email: string;
  role: UserRole;
}

const saveAuth = (data: AuthResponse) => {
  cookieUtil.setAccessToken(data.accessToken);
  cookieUtil.setRefreshToken(data.refreshToken);
  useAuthStore.getState().setUser({
    ...data,
    username: data.email,
  });
};

const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      payload,
    );
    saveAuth(data);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      {
        email: payload.username,
        password: payload.password,
      },
    );
    saveAuth(data);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post("/auth/logout", {});
    } finally {
      useAuthStore.getState().logout();
    }
  },

  getMe: async (): Promise<User> => {
    const { data } = await axiosInstance.get<User>("/auth/me");
    const userWithUsername = {
      ...data,
      username: data.username || data.email,
    };
    useAuthStore.getState().setUser(userWithUsername);
    return userWithUsername;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const { data } = await axiosInstance.put<User>("/customers/profile", payload);
    return data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await axiosInstance.put("/change-password", payload);
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<void> => {
    await axiosInstance.post("/auth/forgot-password", payload);
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<void> => {
    await axiosInstance.post("/auth/reset-password", {
      token: payload.token,
      newPassword: payload.password,
      confirmPassword: payload.confirmPassword,
    });
  },
};

export default authApi;
