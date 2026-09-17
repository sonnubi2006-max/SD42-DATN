import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import addressApi, { type AddressRequest } from "@/api/addressApi";
import useAuthStore from "@/store/authStore";

export const ADDRESS_KEYS = {
  all: ["addresses"] as const,
  default: ["addresses", "default"] as const,
};

export function useAddresses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: ADDRESS_KEYS.all,
    queryFn: addressApi.getMyAddresses,
    enabled: isAuthenticated,
  });
}

export function useDefaultAddress() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: ADDRESS_KEYS.default,
    queryFn: addressApi.getDefault,
    enabled: isAuthenticated,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddressRequest) => addressApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
      toast.success("Đã thêm địa chỉ");
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Thêm địa chỉ thất bại"),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      addressId,
      payload,
    }: {
      addressId: number;
      payload: AddressRequest;
    }) => addressApi.update(addressId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
      toast.success("Đã cập nhật địa chỉ");
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Cập nhật địa chỉ thất bại"),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: number) => addressApi.setDefault(addressId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: number) => addressApi.remove(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
      toast.success("Đã xoá địa chỉ");
    },
  });
}
