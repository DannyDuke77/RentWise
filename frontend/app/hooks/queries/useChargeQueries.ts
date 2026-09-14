// hooks/queries/useChargeQueries.ts
import { useQuery } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { Charge, ChargeStats } from '@/app/src/types/Types';
import { useBusiness } from "@/app/providers/BusinessProvider";

export function useCharges(
    page: number,
    pageSize: number,
    search: string = "",
    status: string = "",
    unitId: string = "",
    tenancyId?: string | null,
    enabled: boolean = true
) {
    const { activeBusinessId } = useBusiness();
    const tenancyFilter = tenancyId ? `&tenancy=${tenancyId}` : '';
    return useQuery({
        queryKey: queryKeys.charges(activeBusinessId, page, pageSize, search, status, unitId, tenancyId || ""),
        queryFn: async () => {
            let url = `/api/charges/?page=${page}&page_size=${pageSize}${tenancyFilter}`;
            
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (status) url += `&status=${status}`;
            if (unitId) url += `&unit_id=${unitId}`;
            
            const response = await apiService.get(url,
                {
                    businessId: activeBusinessId,
                }
            );
            return response;
        },
        enabled: enabled && !!activeBusinessId,
        staleTime: 2 * 60 * 1000,
    });
}

export function useChargeStats(enabled: boolean = true) {
    const { activeBusinessId } = useBusiness();

    return useQuery({
        queryKey: queryKeys.chargeStats(activeBusinessId),
        queryFn: async () => {
            const response = await apiService.get('/api/charges/stats/',
                {
                    businessId: activeBusinessId,
                }
            );
            return response as ChargeStats;
        },
        enabled: enabled && !!activeBusinessId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useChargeDetails(chargeId: string) {
    return useQuery({
        queryKey: queryKeys.chargeDetails(chargeId),
        queryFn: async () => {
            const response = await apiService.get(`/api/charges/${chargeId}/`);
            return response;
        },
        enabled: !!chargeId,
        staleTime: 5 * 60 * 1000,
    });
}