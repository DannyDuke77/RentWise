import { useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from '@/app/providers/BusinessProvider';

interface PaymentMutationVariables {
    unitId: string;
    propertyId: string;
    payload?: Record<string, any>;
    targetMonth?: number;
    targetYear?: number;
    paymentId?: string;
}

const invalidatePaymentQueries = (
    queryClient: QueryClient,
    activeBusinessId: string | null | undefined,
    variables: PaymentMutationVariables
) => {
    queryClient.invalidateQueries({
        queryKey: ['payments', activeBusinessId],
        exact: false,
    });
    queryClient.invalidateQueries({
        queryKey: ['unit-payments', variables.unitId],
        exact: false,
    });
    queryClient.invalidateQueries({
        queryKey: ['property-units', activeBusinessId],
        exact: false,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.units() });
    queryClient.invalidateQueries({ queryKey: queryKeys.paymentAnalytics() });
    queryClient.invalidateQueries({
        queryKey: queryKeys.propertyPaymentAnalytics(variables.propertyId),
    });

    if (!('targetMonth' in variables) || (variables.targetMonth && variables.targetYear)) {
        queryClient.invalidateQueries({
            queryKey: ['property-rent-summary', activeBusinessId],
            exact: false,
        });
    }
};

export function usePaymentMutation() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ payload }: PaymentMutationVariables) =>
            apiService.post(`/api/payments/`, payload),
        onSuccess: (_, variables) => {
            invalidatePaymentQueries(queryClient, activeBusinessId, variables);
        },
    });
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ paymentId, payload }: PaymentMutationVariables) =>
            apiService.patch(`/api/payments/${paymentId}/`, payload),
        onSuccess: (_, variables) => {
            invalidatePaymentQueries(queryClient, activeBusinessId, variables);
        },
    });
}

export function useDeletePayment() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ paymentId }: PaymentMutationVariables) =>
            apiService.delete(`/api/payments/${paymentId}/`),
        onSuccess: (_, variables) => {
            invalidatePaymentQueries(queryClient, activeBusinessId, variables);
        },
    });
}