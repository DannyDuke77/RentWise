import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';
import { useBusiness } from '@/app/providers/BusinessProvider';

export function useCreateBusiness() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Record<string, any>) =>
            apiService.post("/api/businesses/", payload),
        onSuccess: (data) => {
            queryClient.setQueryData(
                queryKeys.businesses(),
                (oldData: any) => {
                    if (!oldData) {
                        return [data];
                    }

                    if (Array.isArray(oldData)) {
                        return [...oldData, data];
                    }

                    return {
                        ...oldData,
                        results: [...(oldData.results ?? []), data],
                    };
                }
            );

            queryClient.invalidateQueries({
                queryKey: queryKeys.businesses(),
            });
        },
    });
}

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
            queryClient.invalidateQueries({
                queryKey: queryKeys.businesses(),
            });
        },
    });
}

export function useInviteBusinessMember() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();
    return useMutation({
      mutationFn: ({ businessId, email, role, }: { businessId: string; email: string; role: "manager" | "staff"; }) =>
        apiService.post(`/api/businesses/invitations/`, { email, role, }),

      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['business-invitations', activeBusinessId],
          exact: false
        })
      },
    });
}

export function useCancelBusinessInvitation() {
  const queryClient = useQueryClient();
  const { activeBusinessId } = useBusiness();
  return useMutation({
    mutationFn: ({ businessId, invitationId, }: { businessId: string; invitationId: string; }) =>
      apiService.delete(`/api/businesses/invitations/${invitationId}/`),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['business-invitations', activeBusinessId],
        exact: false
      });
    },
  });
}

export function useResendBusinessInvitation() {
  const queryClient = useQueryClient();
  const { activeBusinessId } = useBusiness();
  return useMutation({
    mutationFn: ({ businessId,  invitationId, }: { businessId: string; invitationId: string; }) => 
        apiService.post(`/api/businesses/invitations/${invitationId}/resend/`, {}),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['business-invitations', activeBusinessId],
        exact: false
      });
    },
  });
}

export function useUpdateBusinessMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ businessId, membershipId, role,}: { businessId: string; membershipId: string; role: "manager" | "staff"; }) =>
      apiService.patch(`/api/businesses/members/${membershipId}/`, { role }),

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