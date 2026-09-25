import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";
import { TenantProfile } from "@/app/src/types/Types";

export function useTenantPortal(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.tenantPortal(),
    queryFn: async () => {
      const data: TenantProfile = await apiService.get("/api/tenant/me/");
      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
