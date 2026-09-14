import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from '@/app/providers/BusinessProvider';

export function useCreateProperty() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();
    return useMutation({
        mutationFn: (payload: any) => apiService.post('/api/properties/', payload, {businessId: activeBusinessId}),
        onSuccess: () => {
            queryClient.invalidateQueries({ 
                queryKey: ['properties', activeBusinessId],
                exact: false
             });
        },
    });
}

export function useUpdateProperty() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();
    return useMutation({
        mutationFn: ({ propertyId, payload }: { propertyId: string; payload: any }) => apiService.patch(`/api/properties/${propertyId}/`, payload, {businessId: activeBusinessId}),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: ['property', activeBusinessId],
                exact: false
            });
            queryClient.invalidateQueries({ 
                queryKey: ['properties', activeBusinessId],
                exact: false
             });
        },
    });
}