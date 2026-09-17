
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { userApi } from "@/api/userApi";
import type {
  UserListParams,
  UserRole,
  CreateStaffPayload,
  ResetPasswordPayload,
  UpdateUserPayload,
} from "@/api/userApi";

export const USER_KEYS = {
  all: ["users"] as const,
  list: (p: UserListParams) => ["users", "list", p] as const,
  detail: (id: number) => ["users", "detail", id] as const,
  statictis: () => ["users"] as const,
};

export const useUserList = (params: UserListParams) =>
  useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => userApi.getList(params),
    staleTime: 2 * 60_000,
  });

export const useUserById = (id?: number) =>
  useQuery({
    queryKey: USER_KEYS.detail(id!),
    queryFn: () => userApi.getById(id!),
    enabled: id != null && Number.isFinite(id),
  });

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => userApi.createStaff(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  });
};

export function useUserStatictis() {
  return useQuery({
    queryKey: USER_KEYS.statictis(),
    queryFn: () => userApi.getUserStatistics(),
    placeholderData: keepPreviousData, 
    staleTime: 1000 * 60 * 3, 
  });
}

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) =>
      userApi.updateRole(id, { role }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      qc.invalidateQueries({ queryKey: USER_KEYS.detail(id) });
    },
  });
};

export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => userApi.updateStatus(id),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      qc.invalidateQueries({ queryKey: USER_KEYS.detail(id) });
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      userApi.updateUser(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      qc.invalidateQueries({ queryKey: USER_KEYS.detail(id) });
    },
  });
};

export const useExportUsers = () => {
  return useMutation({
    mutationFn: ({ params, ids }: { params: UserListParams; ids?: number[] }) =>
      userApi.export(params, ids),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Danh_sach_nguoi_dung_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
};

export const useResetPassword = () =>
  useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ResetPasswordPayload;
    }) => userApi.resetPassword(id, payload),
  });
