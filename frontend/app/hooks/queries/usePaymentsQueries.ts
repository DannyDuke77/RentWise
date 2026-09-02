import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { PaginatedPayments, PaymentAnalytics } from '@/app/src/types/Types';

export function usePayments(
  page: number = 1,
  pageSize: number = 2,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.payments(page, pageSize),
    queryFn: async () => {
      const data: PaginatedPayments = await apiService.get(
        `/api/payments/?page=${page}&page_size=${pageSize}`
      );

      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePaymentAnalytics(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.paymentAnalytics(),
    queryFn: async () => {
      const data: PaymentAnalytics = await apiService.get(
        `/api/payments/analytics/`
      );

      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePropertyPaymentAnalytics(
  propertyId: string,
  options?: Omit<UseQueryOptions<PaymentAnalytics>, 'queryKey' | 'queryFn'>
) {
  const { enabled = true, ...restOptions } = options || {};

  return useQuery({
    queryKey: queryKeys.propertyPaymentAnalytics(propertyId),
    queryFn: async () => {
      const data: PaymentAnalytics = await apiService.get(
        `/api/payments/property/${propertyId}/analytics/`
      );
      return data;
    },
    staleTime: 10 * 60 * 1000,
    ...restOptions,
    enabled: Boolean(enabled && propertyId),
  });
}