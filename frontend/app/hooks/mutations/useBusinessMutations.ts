import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useUpdateBusiness() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ businessId, payload }: { businessId: string; payload: Record<string, any> }) =>
            apiService.patch(`/api/businesses/${businessId}/`, payload),
        onSuccess: (data) => {
            queryClient.setQueryData(
                queryKeys.businesses(),
                (oldData: any) => {
                    if (!oldData) return oldData;

                    if (Array.isArray(oldData)) {
                        return oldData.map((business) =>
                            business.id === data.id ? data : business
                        );
                    }

                    return {
                        ...oldData,
                        results: oldData.results?.map((business: any) =>
                            business.id === data.id ? data : business
                        ),
                    };
                }
            );
        },
    });
}

export function useInviteBusinessMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ businessId, email, role, }: { businessId: string; email: string; role: "manager" | "staff"; }) =>
            apiService.post(`/api/businesses/${businessId}/invitations/`, { email, role, }),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.businessInvitations(variables.businessId), });
        },
    });
}

export function useCancelBusinessInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ businessId, invitationId, }: { businessId: string; invitationId: string; }) =>
      apiService.delete(`/api/businesses/${businessId}/invitations/${invitationId}/`),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessInvitations(variables.businessId),
      });
    },
  });
}

export function useResendBusinessInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ businessId,  invitationId, }: { businessId: string; invitationId: string; }) => 
        apiService.post(`/api/businesses/${businessId}/invitations/${invitationId}/resend/`, {}),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['business-invitations', variables.businessId],
        exact: false
      });
    },
  });
}

export function useUpdateBusinessMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ businessId, membershipId, role,}: { businessId: string; membershipId: string; role: "manager" | "staff"; }) =>
      apiService.patch(`/api/businesses/${businessId}/members/${membershipId}/`, { role }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['business-members', variables.businessId],
        exact: false
      });
    },
  });
}

export function useRemoveBusinessMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ businessId, membershipId }: { businessId: string; membershipId: string; }) =>
      apiService.delete(`/api/businesses/${businessId}/members/${membershipId}/`),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['business-members', variables.businessId],
        exact: false
      });
    },
  });
}