import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from "@/app/providers/BusinessProvider";

export function useChargeTypes(
    page: number,
    pageSize: number,
    search?: string,
    statusFilter?: string,
    enabled?: boolean
) {
    const { activeBusinessId } = useBusiness();

    return useQuery({
        queryKey: queryKeys.chargeTypes(activeBusinessId, page, pageSize, search, statusFilter),
        queryFn: async () => {
            const data = await apiService.get(`/api/charge-types/?page=${page}&page_size=${pageSize}&search=${search}&is_active=${statusFilter}`);
            return data;
        },
        enabled: enabled && !!activeBusinessId,
        staleTime: 10 * 60 * 1000,
    });
}

export function useUserProfile(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.userProfile(),
        queryFn: () => apiService.get('/api/auth/settings'),
        enabled,
        staleTime: 10 * 60 * 1000,
    });
}