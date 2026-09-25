import { useQuery } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useBusinesses(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.businesses(),
    queryFn: async () => {
      const data = await apiService.get('/api/businesses/');
      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
  });
}

export function useBusinessMembers(businessId: string | null, page: number, pageSize: number, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.businessMembers(businessId, page, pageSize),
    queryFn: async () => {
      return await apiService.get(`/api/businesses/members/?page=${page}&page_size=${pageSize}`);
    },
    enabled: enabled && !!businessId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessInvitations(businessId: string | null, page: number, pageSize: number, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.businessInvitations(businessId, page, pageSize),
    queryFn: async () => {
      return await apiService.get(`/api/businesses/invitations/?page=${page}&page_size=${pageSize}`);
    },
    enabled: enabled && !!businessId,
    staleTime: 5 * 60 * 1000,
  });
}