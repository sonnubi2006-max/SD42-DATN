import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import authApi, {
  type ChangePasswordPayload,
  type ForgotPasswordPayload,
  type LoginPayload,
  type RegisterPayload,
  type UpdateProfilePayload,
  type ResetPasswordPayload,
} from "@/api/authApi";
import useAuthStore from "@/store/authStore";

export const AUTH_KEYS = {
  me: ["auth", "me"] as const,
};

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      toast.success("Đăng nhập thành công");
      navigate("/");
    },
    onError: (err: { apiMessage?: string }) => {
      console.log(err.apiMessage);
      toast.error(err.apiMessage ?? "Tên đăng nhập hoặc mật khẩu không đúng");
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      toast.success("Đăng ký thành công");
      navigate("/");
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Đăng ký thất bại"),
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      navigate("/login");
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      authApi.updateProfile(payload),
    onSuccess: (customer) => {
      const userWithUsername = {
        ...customer,
        username: customer.username || customer.email,
      };
      queryClient.setQueryData(AUTH_KEYS.me, userWithUsername);
      useAuthStore.getState().setUser(userWithUsername);
      toast.success("Cập nhật hồ sơ thành công");
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Cập nhật hồ sơ thất bại"),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      authApi.changePassword(payload),
    onSuccess: () => toast.success("Đổi mật khẩu thành công"),
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Đổi mật khẩu thất bại"),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
  });
}

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    onSuccess: () => {
      toast.success("Đặt lại mật khẩu thành công");
      navigate("/login");
    },
  });
}
