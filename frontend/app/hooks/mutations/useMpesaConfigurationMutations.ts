import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";
import { useBusiness } from "@/app/providers/BusinessProvider";

type MpesaConfigurationPayload = {
  consumer_key?: string;
  consumer_secret?: string;
  shortcode?: string;
  passkey?: string;
  account_type?: "paybill" | "till";
  environment?: "sandbox" | "production";
  is_active?: boolean;
};

export function useCreateMpesaConfiguration() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

    return useMutation({
        mutationFn: ({payload }: { payload: MpesaConfigurationPayload; }) =>
            apiService.post("/api/v1/payments/configurations/", payload),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
            queryKey: queryKeys.mpesaConfiguration(activeBusinessId),
            });
        },
    });
}

export function useUpdateMpesaConfiguration() {
    const queryClient = useQueryClient();
    const { activeBusinessId } = useBusiness();

  return useMutation({
    mutationFn: ({ configurationId, payload }: { configurationId: string; payload: MpesaConfigurationPayload; }) =>
      apiService.patch(`/api/v1/payments/configurations/${configurationId}/`, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.mpesaConfiguration(activeBusinessId),
      });
    },
  });
}