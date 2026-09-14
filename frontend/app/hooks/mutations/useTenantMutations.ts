import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from '@/app/providers/BusinessProvider';

export function useAddTenant() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ unitId, payload, propertyId }: { unitId: string; payload: any; propertyId: string; }) => apiService.post(`/api/tenants/unit/${unitId}/`, payload),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitTenants(variables.unitId) });
            queryClient.invalidateQueries({ 
                queryKey: ['property-units', activeBusinessId],
                exact: false 
            });
            queryClient.invalidateQueries({ 
                queryKey: ['tenants', activeBusinessId],
                exact: false
             });
            queryClient.invalidateQueries({ 
                queryKey: ['properties', activeBusinessId],
                exact: false
             });
        },
    });
}

interface UpdateTenantPayload {
    full_name?: string;
    phone?: string;
    email?: string;
    id_number?: string;
}

export const useUpdateTenant = () => {
    const queryClient = useQueryClient();
    const {activeBusinessId} = useBusiness();

    return useMutation({
        mutationFn: async ({ tenantId, payload, }: { tenantId: string; payload: UpdateTenantPayload; }) => {
            apiService.patch(`/api/tenants/${tenantId}/`, payload, 
                {
                    businessId: activeBusinessId
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
        },
    });
};

export function useRemoveRoommate() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ unitId, tenantId, propertyId }: { unitId: string; tenantId: string; propertyId: string; }) =>
            apiService.post(`/api/tenants/unit/${unitId}/remove-roommate/${tenantId}/`, {}, 
                {
                    businessId: activeBusinessId
                }
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitTenants(variables.unitId) });
            queryClient.invalidateQueries({ 
                queryKey: ['property-units', activeBusinessId],
                exact: false 
            });
            queryClient.invalidateQueries({ 
                queryKey: ['tenants', activeBusinessId],
                exact: false
             });
        },
    });
}

export function useVacateUnit() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ unitId, propertyId }: { unitId: string; propertyId: string; }) => apiService.post(`/api/tenants/unit/${unitId}/vacate/`, {}),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitTenants(variables.unitId) });
            queryClient.invalidateQueries({ 
                queryKey: ['property-units', activeBusinessId],
                exact: false 
            });
            queryClient.invalidateQueries({ 
                queryKey: ['tenants', activeBusinessId],
                exact: false
             });
            queryClient.invalidateQueries({
                queryKey:['properties', activeBusinessId],
                exact: false
            })
        },
    });
}