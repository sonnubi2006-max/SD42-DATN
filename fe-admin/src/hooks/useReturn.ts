import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { returnApi } from "@/api/returnApi";
import type {
  CompleteReturnRequest,
  CreateReturnRequest,
  ReturnStatus,
} from "@/api/returnApi";

export const RETURN_KEYS = {
  all: ["returns"] as const,
  list: (params: object) => ["returns", "list", params] as const,
  detail: (id: number) => ["returns", "detail", id] as const,
};

export function useReturnList(params: {
  status?: ReturnStatus;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}) {
  return useQuery({
    queryKey: RETURN_KEYS.list(params),
    queryFn: () => returnApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 5000,
  });
}

export function useReturnDetail(id: number | null) {
  return useQuery({
    queryKey: RETURN_KEYS.detail(id!),
    queryFn: () => returnApi.getById(id!),
    enabled: id !== null,
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateReturnRequest) => returnApi.create(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RETURN_KEYS.all });
      qc.invalidateQueries({ queryKey: ["orders"] }); 
      qc.invalidateQueries({ queryKey: ["inventories"] }); 
    },
  });
}

export function useApproveReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => returnApi.approve(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: RETURN_KEYS.all });
      qc.invalidateQueries({ queryKey: RETURN_KEYS.detail(id) });
    },
  });
}

export function useRejectReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectReason }: { id: number; rejectReason: string }) =>
      returnApi.reject(id, { rejectReason }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: RETURN_KEYS.all });
      qc.invalidateQueries({ queryKey: RETURN_KEYS.detail(variables.id) });
      qc.invalidateQueries({ queryKey: ["orders"] }); 
    },
  });
}

export function useCompleteReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload?: CompleteReturnRequest;
    }) => returnApi.complete(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: RETURN_KEYS.all });
      qc.invalidateQueries({ queryKey: RETURN_KEYS.detail(variables.id) });
      qc.invalidateQueries({ queryKey: ["inventories"] }); 
      qc.invalidateQueries({ queryKey: ["orders"] }); 
    },
  });
}
