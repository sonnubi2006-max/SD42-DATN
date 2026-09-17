import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { customerApi } from "@/api/customerApi";
import type {
  CustomerListParams,
  CustomerStatus,
  CustomerRequest,
  AddressRequest,
} from "@/api/customerApi";

export const CUSTOMER_KEYS = {
  all: ["customers"] as const,
  list: (p: CustomerListParams) => ["customers", "list", p] as const,
  detail: (id: number) => ["customers", "detail", id] as const,
  addresses: (id: number) => ["customers", "addresses", id] as const,
  statistics: () => ["customers", "statistics"] as const,
};

export const useCustomerList = (params: CustomerListParams) =>
  useQuery({
    queryKey: CUSTOMER_KEYS.list(params),
    queryFn: () => customerApi.getList(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export const useCustomer = (id: number) =>
  useQuery({
    queryKey: CUSTOMER_KEYS.detail(id),
    queryFn: () => customerApi.getById(id),
    enabled: !!id,
  });

export const useCustomerStatistics = () =>
  useQuery({
    queryKey: CUSTOMER_KEYS.statistics(),
    queryFn: () => customerApi.getStatistics(),
    staleTime: 1000 * 60 * 3,
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerRequest) => customerApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.all }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CustomerRequest }) =>
      customerApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
    },
  });
};

export const useSetCustomerStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: CustomerStatus }) =>
      customerApi.setStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
    },
  });
};

export const useCustomerAddresses = (id: number, enabled = true) =>
  useQuery({
    queryKey: CUSTOMER_KEYS.addresses(id),
    queryFn: () => customerApi.getAddresses(id),
    enabled: !!id && enabled,
  });

export const useSetDefaultAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, addressId }: { id: number; addressId: number }) =>
      customerApi.setDefaultAddress(id, addressId),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.addresses(id) }),
  });
};

export const useCreateCustomerAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AddressRequest }) =>
      customerApi.createAddress(id, payload),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.addresses(id) }),
  });
};

export const useUpdateCustomerAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      addressId,
      payload,
    }: {
      id: number;
      addressId: number;
      payload: AddressRequest;
    }) => customerApi.updateAddress(id, addressId, payload),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.addresses(id) }),
  });
};

export const useDeleteCustomerAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, addressId }: { id: number; addressId: number }) =>
      customerApi.deleteAddress(id, addressId),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: CUSTOMER_KEYS.addresses(id) }),
  });
};
