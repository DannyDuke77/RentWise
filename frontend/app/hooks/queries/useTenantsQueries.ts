import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";
import { useBusiness } from "@/app/providers/BusinessProvider";

export function useTenants(
    page: number = 1,
    pageSize: number = 10,
    search: string = "",
    status: string = "",
    enabled: boolean = true
) {
    const { activeBusinessId } = useBusiness();

    return useQuery({
        queryKey: queryKeys.tenants(activeBusinessId, page, pageSize, search, status),
        queryFn: async () => {
            const data = await apiService.get(`/api/tenants/?page=${page}&page_size=${pageSize}&search=${search}&status=${status}`,
                {
                    businessId: activeBusinessId,
                }
            );
            return data;
        },
        enabled: enabled && !!activeBusinessId,
        staleTime: 10 * 60 * 1000,
    });

}