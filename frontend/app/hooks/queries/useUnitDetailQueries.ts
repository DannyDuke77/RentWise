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

export function useUnitPayments(
    unitId: string, 
    page: number, 
    pageSize: number, 
    enabled: boolean = true,
    search: string = "",
    filterMethod: string = "",
    filterDate: string = "",
) {
    return useQuery({
        queryKey: queryKeys.unitPayments(unitId, page, pageSize, search, filterMethod, filterDate),
        queryFn: async () => {
            const res = await apiService.get(`/api/units/${unitId}/payments/?page=${page}&page_size=${pageSize}&search=${search}&payment_method=${filterMethod}&filter_date=${filterDate}`);
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
        enabled: enabled && !!unitId,
        staleTime: 5 * 60 * 1000,
    });
}
