import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { PaginatedPayments, PaymentAnalytics } from '@/app/src/types/Types';
import { useBusiness } from "@/app/providers/BusinessProvider";

export function usePayments(
  page: number = 1,
  pageSize: number = 2,
  search: string = "",
  paymentMethod: string = "",
  filterDate: string = "",
  filterType: string = "",
  enabled: boolean = true
) {
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: queryKeys.payments(activeBusinessId, page, pageSize, search, paymentMethod, filterDate, filterType),
    queryFn: async () => {
      const data: PaginatedPayments = await apiService.get(
        `/api/payments/?page=${page}&page_size=${pageSize}&search=${search}&payment_method=${paymentMethod}&filter_date=${filterDate}&filter_type=${filterType}`,
        {
          businessId: activeBusinessId,
        }
      );

      return data;
    },
    enabled: enabled && !!activeBusinessId,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePaymentAnalytics(enabled: boolean = true) {
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: queryKeys.paymentAnalytics(),
    queryFn: async () => {
      const data: PaymentAnalytics = await apiService.get(`/api/payments/analytics/`, 
        {
          businessId: activeBusinessId,
        }
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
  const { activeBusinessId } = useBusiness();

  return useQuery({
    queryKey: queryKeys.propertyPaymentAnalytics(propertyId),
    queryFn: async () => {
      const data: PaymentAnalytics = await apiService.get(`/api/payments/property/${propertyId}/analytics/`,
        {
          businessId: activeBusinessId,
        }
      );
      return data;
    },
    staleTime: 10 * 60 * 1000,
    ...restOptions,
    enabled: Boolean(enabled && propertyId),
  });
}