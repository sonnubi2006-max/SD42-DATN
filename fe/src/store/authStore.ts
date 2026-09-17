import { create } from "zustand";
import { cookieUtil } from "@/utils/cookie";
import type { User } from "@/api/authApi";

interface AuthState {
  user: User | null;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const useAuthStore = create<AuthState>()((set) => ({
  user: null,

  setTokens: (accessToken, refreshToken) => {

    cookieUtil.setAccessToken(accessToken);
    cookieUtil.setRefreshToken(refreshToken);
  },

  setUser: (user) => set({ user }),

  logout: () => {
    cookieUtil.clearTokens();
    set({ user: null });
  },

  isAuthenticated: () => !!cookieUtil.getAccessToken(),
}));

export default useAuthStore;
