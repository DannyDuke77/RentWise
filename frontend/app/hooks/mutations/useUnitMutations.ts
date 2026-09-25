import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from '@/app/providers/BusinessProvider';

export function useCreateUnit() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ payload }: { propertyId: string; payload: Record<string, any> }) => apiService.post('/api/units/', payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.property(activeBusinessId, variables.propertyId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.units() });
            queryClient.invalidateQueries({ 
                queryKey: ['property-units', activeBusinessId],
                exact: false 
            });
        },
    });
}

export function useUpdateUnit() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ unitId, propertyId, payload }: { unitId: string; propertyId: string; payload: Record<string, any> }) => apiService.patch(`/api/units/${unitId}/`, payload),        
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.property(activeBusinessId, variables.propertyId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.unit(variables.unitId) });
            queryClient.invalidateQueries({ 
                queryKey: ['property-units', activeBusinessId],
                exact: false 
            });

        },
    });
}