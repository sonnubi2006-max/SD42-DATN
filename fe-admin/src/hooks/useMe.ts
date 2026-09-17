
import { useQuery } from "@tanstack/react-query";
import authApi from "@/api/authApi";
import useAuthStore from "@/store/authStore";

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const data = await authApi.getMe();
      return data;
    },
    enabled: isAuthenticated, 
  });
}
