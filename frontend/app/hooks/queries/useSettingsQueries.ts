import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useBusinessProfile(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.businessProfile(),
        queryFn: () => apiService.get('/api/auth/settings/business-profile/'),
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes stale
    });
}

export function useChargeTypes(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.chargeTypes(),
        queryFn: async () => {
            const data = await apiService.get('/api/charge-types/');
            return Array.isArray(data.results) ? data.results : [];
        },
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes stale
    });
}

export function useUserProfile(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.userProfile(),
        queryFn: () => apiService.get('/api/auth/settings/user-settings/'),
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes stale
    });
}