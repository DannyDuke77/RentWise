import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useCreateUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: any) => apiService.post('/api/units/', formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.units() });
        },
    });
}

export function useUpdateUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ unitId, propertyId, formData }: { unitId: string; propertyId: string; formData: any }) => apiService.patch(`/api/units/${unitId}/`, formData),        
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitDetails(variables.unitId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyUnits(variables.propertyId, 1, 10) });

        },
    });
}

export function useAddTenant(unitId?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ unitId, payload }: { unitId: string; payload: any }) => apiService.post(`/api/tenants/unit/${unitId}/`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitTenants(unitId) });
        },
    });
}

export function useRemoveRoommate(unitId?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tenantId: string) =>
            apiService.post(`/api/units/${unitId}/remove-roommate/${tenantId}/`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitTenants(unitId) });
        },
    });
}

export function useVacateUnit(unitId?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiService.post(`/api/units/${unitId}/vacate/`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitTenants(unitId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.unitPayments(1, 10, unitId) });
        },
    });
}
