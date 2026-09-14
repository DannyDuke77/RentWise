import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";

export type TenantTenancy = {
  id: string;
  unit: string;
  property: string;
  monthly_rent: string;
  balance: string;
  deposit_held: string;
  start_date: string;
  billing_start_date: string | null;
};

export type TenantProfile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  tenancies: TenantTenancy[];
};

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
