import { useQuery, keepPreviousData } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";
import { useBusiness } from "@/app/providers/BusinessProvider";
import { UnitsStats } from "@/app/src/types/Types";

// Single unit
export function useUnit(unitId: string) {
    const { activeBusinessId } = useBusiness();
    return useQuery({
        queryKey: queryKeys.unit(unitId),
        queryFn: async () => {
            const data = await apiService.get(`/api/units/${unitId}/`);
            return data;
        },
        enabled: !!unitId && !!activeBusinessId,
    });
}

// All units
export function useUnits(
    page: number,
    pageSize: number,
    search: string = "",
    status: string = "",
    propertyId: string = "",
    rentStatus: string = ""
) {
    const { activeBusinessId } = useBusiness();

    const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
    });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (propertyId) params.set("property", propertyId);
    if (rentStatus) params.set("rent_status", rentStatus);

    return useQuery({
        queryKey: ["units", activeBusinessId, page, pageSize, search, status, propertyId, rentStatus],
        queryFn: async () => apiService.get(`/api/units/?${params.toString()}`),
        enabled: !!activeBusinessId,
        placeholderData: keepPreviousData,
    });
}