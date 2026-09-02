import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useCreateProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => apiService.post('/api/properties/', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.properties() });
        },
    });
}

export function useUpdateProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, payload }: { propertyId: string; payload: any }) => apiService.patch(`/api/properties/${propertyId}/`, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.property(variables.propertyId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.properties() });
        },
    });
}

export function useDeleteProperty(propertyId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiService.patch(`/api/properties/${propertyId}/`, { is_active: false }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.properties() });
        },
    });
}