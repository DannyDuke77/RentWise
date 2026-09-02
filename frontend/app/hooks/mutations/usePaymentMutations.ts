import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useRecordPayment(unitId?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, today, payload} : {propertyId: string, today: Date, payload: any}) => apiService.post(`/api/units/${unitId}/payments/`, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitPayments(1, 10, unitId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyUnits(variables.propertyId, 1, 10) });
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentAnalytics() });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyPaymentAnalytics(variables.propertyId) });
            console.log("month", variables.today.getMonth());
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyRentSummary(variables.propertyId, variables.today.getMonth() + 1, variables.today.getFullYear()) });
        },
    });
}

export function useRecordRefund(unitId?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, today, payload} : {propertyId: string, today: Date, payload: any}) => apiService.post(`/api/units/${unitId}/payments/`, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.unitPayments(1, 10, unitId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyUnits(variables.propertyId, 1, 10) });
            queryClient.invalidateQueries({ queryKey: queryKeys.paymentAnalytics() });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyPaymentAnalytics(variables.propertyId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.propertyRentSummary(variables.propertyId, variables.today.getMonth() + 1, variables.today.getFullYear()) });
        },
    });
}