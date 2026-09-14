import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from '@/app/providers/BusinessProvider';

export function useCreateCharge(tenancyId?: string | null) {
    const queryClient = useQueryClient();    
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: (payload: any) =>
            apiService.post('/api/charges/', { ...payload, tenancy: tenancyId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ 
                queryKey: ['charges', activeBusinessId],
                exact: false
             });
        },
    });
}

export function useUpdateChargeStatus(tenancyId?: string | null) {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            apiService.patch(`/api/charges/${id}/update-status/`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ 
                queryKey: ['charges', activeBusinessId],
                exact: false
             });
        },
    });
}

export function useDeleteCharge(tenancyId?: string | null) {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: (id: string) => apiService.delete(`/api/charges/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ 
                queryKey: ['charges', activeBusinessId],
                exact: false
             });
        },
    });
}