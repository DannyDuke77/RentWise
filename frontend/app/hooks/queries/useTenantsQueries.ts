import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";

export function useTenants(
    page: number = 1,
    pageSize: number = 10,
    enabled: boolean = true
) {
    return useQuery({
        queryKey: queryKeys.tenants(page, pageSize),
        queryFn: async () => {
            const data = await apiService.get(`/api/tenants/?page=${page}&page_size=${pageSize}`);
            return data;
        },
        enabled,
        staleTime: 10 * 60 * 1000,
    });

}