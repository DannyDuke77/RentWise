import { useQuery } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useUnitDetails(unitId?: string | null) {
    return useQuery({
        queryKey: queryKeys.unitDetails(unitId),
        queryFn: async () => {
            const data = await apiService.get(`/api/units/${unitId}/`);
            return data;
        },
        enabled: !!unitId,
    });
}

export function useUnitTenants(unitId?: string | null) {
    return useQuery({
        queryKey: queryKeys.unitTenants(unitId),
        queryFn: async () => {
            const res = await apiService.get(`/api/tenants/unit/${unitId}/`);
            const tenants = res?.tenants || (Array.isArray(res) ? res : []);
            const tenancyId: string | null = res?.tenancy_id ?? null;
            return { tenants, tenancyId };
        },
        enabled: !!unitId,
    });
}

export function useUnitPayments(page: number, pageSize: number, unitId?: string | null, isOccupied?: boolean) {
    return useQuery({
        queryKey: queryKeys.unitPayments(page, pageSize, unitId),
        queryFn: async () => {
            const res = await apiService.get(`/api/units/${unitId}/payments/?page=${page}&page_size=${pageSize}`);
            const data = res?.results || [];
            return {
                count: res.count || 0,
                payments: data.payments || [],
                balance: Number(data.balance || 0),
                depositHeld: Number(data.deposit_held || 0),
                charges: data.charges || [],
                monthlyRent: Number(data.monthly_rent || 0),
            };
        },
        enabled: !!unitId && !!isOccupied,
    });
}

export function useCharges(tenancyId?: string | null) {
    return useQuery({
        queryKey: queryKeys.charges(tenancyId),
        queryFn: async () => {
            const data = await apiService.get(`/api/charges/?tenancy=${tenancyId}`);
            return Array.isArray(data.results) ? data.results : [];
        },
        enabled: !!tenancyId,
    });
}