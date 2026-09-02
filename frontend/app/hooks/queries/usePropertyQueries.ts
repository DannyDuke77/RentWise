import { useQuery, useQueries, UseQueryOptions, QueryOptions } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useToday } from '@/app/src/utils/timeStore';
import { PropertySummary } from '@/app/components/properties/PropertyRentSummary';

export function useProperties(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.properties(),
        queryFn: async () => {
            const data = await apiService.get('/api/properties/');
            return Array.isArray(data.results) ? data.results : [];
        },
        enabled,
        staleTime: 10 * 60 * 1000,
    });
}

export function usePropertyTypes(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.propertyTypes(),
        queryFn: async () => {
            const data = await apiService.get('/api/properties/types/');
            return Array.isArray(data) ? data : [];
        },
        enabled,
        staleTime: 10 * 60 * 1000,
    });
}

export const propertyQueries = {
  property: (propertyId: string) => ({
    queryKey: queryKeys.property(propertyId),
    queryFn: async () => {
      const data = await apiService.get(`/api/properties/${propertyId}/`);
      return data;
    },
    staleTime: 10 * 60 * 1000,
  }),

  rentSummary: (propertyId: string, month: number, year: number) => ({
    queryKey: queryKeys.propertyRentSummary(propertyId, month, year),
    queryFn: async () => {
      const data = await apiService.get(
        `/api/properties/${propertyId}/rent-summary/?month=${month}&year=${year}`
      );
      return data.summary as PropertySummary;
    },
    staleTime: 10 * 60 * 1000,
  }),

  units: (propertyId: string, page: number, pageSize: number) => ({
    queryKey: queryKeys.propertyUnits(propertyId, page, pageSize),
    queryFn: async () => {
      const data = await apiService.get(`/api/properties/${propertyId}/units/?page=${page}&page_size=${pageSize}`);
      return data;
    },
    staleTime: 10 * 60 * 1000,
  }),
};

export function usePropertyDetail(propertyId: string) {
  return useQuery({
    ...propertyQueries.property(propertyId),
    enabled: !!propertyId
  });
}

export function usePropertyUnits(propertyId: string, page: number, pageSize: number) {
  return useQuery(propertyQueries.units(propertyId, page, pageSize));
}


export function usePropertySummary(
  propertyId: string, 
  month: number, 
  year: number, 
  options?: Omit<UseQueryOptions<PropertySummary>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    ...propertyQueries.rentSummary(propertyId, month, year),
    ...options,
  });
}