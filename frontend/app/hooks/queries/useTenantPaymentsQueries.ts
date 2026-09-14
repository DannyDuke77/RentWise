import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";
import { PaginatedPayments } from "@/app/src/types/Types";

export function useTenantPayments(
  page: number = 1,
  pageSize: number = 10,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.tenantPayments(page, pageSize),
    queryFn: async () => {
      const data: PaginatedPayments = await apiService.get(
        `/api/tenant/payments/?page=${page}&page_size=${pageSize}`
      );

      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}