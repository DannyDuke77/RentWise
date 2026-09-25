import { useQuery } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useUnitTenants(unitId?: string | null) {
    return useQuery({
        queryKey: queryKeys.unitTenants(unitId),
        queryFn: async () => {
            const res = await apiService.get(`/api/tenants/unit/${unitId}/`);
            const tenants = res?.tenants || (Array.isArray(res) ? res : []);
            const tenancyId: string | null = res?.tenancy_id ?? null;
            const tenancyBillingStart: string | null = res?.tenancy_billing_start_date ?? null;
            return { tenants, tenancyId, tenancyBillingStart };
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
            const params = new URLSearchParams({
                page: String(page),
                page_size: String(pageSize),
            });

            if (search) params.append("search", search);
            if (filterMethod) params.append("payment_method", filterMethod);
            if (filterDate) params.append("filter_date", filterDate);

            const res = await apiService.get(`/api/units/${unitId}/payments/?${params.toString()}`);

            return {
                count: res?.count || 0,
                next: res?.next || null,
                previous: res?.previous || null,
                payments: res?.payments || [],
                balance: Number(res?.balance || 0),
                depositHeld: Number(res?.deposit_held || 0),
                charges: Number(res?.charges || 0),
                chargeDetails: res?.charge_details || [],
                monthlyRent: Number(res?.monthly_rent || 0),
                status: res?.status || "settled",
            };
        },
        enabled: enabled && !!unitId,
        staleTime: 5 * 60 * 1000,
    });
}