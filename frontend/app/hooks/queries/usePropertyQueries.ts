import { useQuery,  UseQueryOptions } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { PropertySummary } from '@/app/components/payments/MonthlyRentSummary';
import { useBusiness } from '@/app/providers/BusinessProvider';

export function useProperties(page: number, pageSize: number,   search: string = '',) {
  const { activeBusinessId } = useBusiness();
  return useQuery({
    queryKey: queryKeys.properties(activeBusinessId, page, pageSize, search),
    queryFn: async () => {
        const data = await apiService.get(`/api/properties/?page=${page}&page_size=${pageSize}&search=${search}`, 
          {
            businessId: activeBusinessId,
          }
        );
        return data;
    },
    enabled: !!activeBusinessId,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePropertiesStats() {
  const { activeBusinessId } = useBusiness();
  return useQuery({
    queryKey: queryKeys.propertiesStats(activeBusinessId),
    queryFn: async () => {
      const data = await apiService.get(`/api/properties/stats/`, 
        {
          businessId: activeBusinessId,
        }
      );
      return data;
    },
    enabled: !!activeBusinessId,
    staleTime: 10 * 60 * 1000,
  });
}

export const propertyQueries = {
  property: (businessId: string | null, propertyId: string) => ({
    queryKey: queryKeys.property(businessId, propertyId),
    queryFn: async () => {
      const data = await apiService.get(`/api/properties/${propertyId}/`,
        {
          businessId: businessId,
        }
      );
      return data;
    },
    staleTime: 10 * 60 * 1000,
  }),

  rentSummary: (businessId: string | null, propertyId: string, month: number, year: number) => ({
    queryKey: queryKeys.propertyRentSummary(businessId, propertyId, month, year),
    queryFn: async () => {
      const data = await apiService.get(
        `/api/properties/${propertyId}/rent-summary/?month=${month}&year=${year}`,
        {
          businessId: businessId,
        }
      );
      return data.summary as PropertySummary;
    },
    staleTime: 10 * 60 * 1000,
  }),

  units: (
    businessId: string | null, 
    propertyId: string, 
    page: number, 
    pageSize: number, 
    search: string = "", 
    statusFilter: string = "", 
    rentStatusFilter: string = ""
  ) => ({
    queryKey: queryKeys.propertyUnits(businessId, propertyId, page, pageSize, search, statusFilter, rentStatusFilter),
    queryFn: async () => {
      const data = await apiService.get(`/api/properties/${propertyId}/units/?page=${page}&page_size=${pageSize}&search=${search}&status=${statusFilter}&rent_status=${rentStatusFilter}`,
        {
          businessId: businessId,
        }
      );
      return data;
    },
    staleTime: 10 * 60 * 1000,
  }),
};

export function useProperty(propertyId: string) {
  const { activeBusinessId } = useBusiness();
  return useQuery({
    ...propertyQueries.property(activeBusinessId, propertyId),
    enabled: !!activeBusinessId && !!propertyId,
  });
}

export function usePropertyUnits(
  propertyId: string, 
  page: number, 
  pageSize: number,
  search: string = "",
  statusFilter: string = "",
  rentStatusFilter: string = "",
  options?: { enabled: boolean }
) {
  const { activeBusinessId } = useBusiness();
  return useQuery({
    ...propertyQueries.units(activeBusinessId, propertyId, page, pageSize, search, statusFilter, rentStatusFilter),
    enabled: !!activeBusinessId && (options?.enabled ?? true),
  });
}


export function usePropertySummary(
  propertyId: string, 
  month: number, 
  year: number, 
  options?: Omit<UseQueryOptions<PropertySummary>, 'queryKey' | 'queryFn'>
) {
  const { activeBusinessId } = useBusiness();
  return useQuery({
    ...propertyQueries.rentSummary(activeBusinessId, propertyId, month, year),
    ...options,
    enabled: !!activeBusinessId && (options?.enabled ?? true),
  });
}