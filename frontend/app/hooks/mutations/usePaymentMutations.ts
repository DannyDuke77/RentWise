import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from '@/app/providers/BusinessProvider';

interface PaymentMutationVariables {
    unitId: string;
    propertyId: string;
    payload?: Record<string, any>;
    targetMonth: number;
    targetYear: number;
    paymentId?: string;
}

export function usePaymentMutation() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ payload }: PaymentMutationVariables) => 
            apiService.post(`/api/payments/`, payload,
                {
                    businessId: activeBusinessId
                }
            ),
        onSuccess: (_, variables) => {  
            queryClient.invalidateQueries({
                queryKey: ['payments', activeBusinessId],
                exact: false
            })
            queryClient.invalidateQueries({ 
                queryKey: ['unit-payments', variables.unitId],
                exact: false
            });
            queryClient.invalidateQueries({ 
                queryKey: ['property-units', activeBusinessId],
                exact: false 
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentAnalytics() });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyPaymentAnalytics(variables.propertyId) });
            queryClient.invalidateQueries({ 
                queryKey: ['property-rent-summary', activeBusinessId],
                exact: false 
            });
        },
    });
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();
    
    return useMutation({
        mutationFn: ({ paymentId, payload }: PaymentMutationVariables) => 
            apiService.patch(`/api/payments/${paymentId}/`, payload, 
                {
                    businessId: activeBusinessId
                }
            ),
        onSuccess: (_, variables) => {  
            queryClient.invalidateQueries({
                queryKey: ['payments', activeBusinessId],
                exact: false
            })
            queryClient.invalidateQueries({ 
                queryKey: ['unit-payments', variables.unitId],
                exact: false
            });
            queryClient.invalidateQueries({ 
                queryKey: ['property-units', activeBusinessId],
                exact: false 
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentAnalytics() });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyPaymentAnalytics(variables.propertyId) });
            if (variables.targetMonth && variables.targetYear) {
                queryClient.invalidateQueries({ 
                    queryKey: ['property-rent-summary', activeBusinessId],
                    exact: false 
                });
            }
        },
    });
}

export function useDeletePayment() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({ paymentId }: PaymentMutationVariables) => 
            apiService.delete(`/api/payments/${paymentId}/`, 
                {
                    businessId: activeBusinessId
                }
            ),
        onSuccess: (_, variables) => {  
            queryClient.invalidateQueries({
                queryKey: ['payments', activeBusinessId],
                exact: false
            })
            queryClient.invalidateQueries({ 
                queryKey: ['unit-payments', variables.unitId],
                exact: false
            });
            queryClient.invalidateQueries({ 
                queryKey: ['property-units', activeBusinessId],
                exact: false 
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentAnalytics() });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyPaymentAnalytics(variables.propertyId) });
            if (variables.targetMonth && variables.targetYear) {
                queryClient.invalidateQueries({ 
                    queryKey: ['property-rent-summary', activeBusinessId],
                    exact: false 
                });
            }
        },
    });
}