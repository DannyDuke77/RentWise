import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from '@/app/providers/BusinessProvider';

export function useUpdateUserProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: FormData | Record<string, any>) =>
            apiService.patch('/api/auth/settings/user-settings/', payload),
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.userProfile(), data);
        },
    });
}

export function useCreateChargeType() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: (payload: FormData | Record<string, any>) => apiService.post('/api/charge-types/', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['charge-types', activeBusinessId],
                exact: false
            });
        },
    });
}


export function useUpdateChargeType() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: (payload: any) => apiService.patch(`/api/charge-types/${payload.id}/`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ 
                queryKey: ['charge-types', activeBusinessId],
                exact: false
             });
        },
    });
}
