import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";
import { useBusiness } from "@/app/providers/BusinessProvider";``

export type MpesaConfiguration = {
  id: string;
  consumer_key: string;
  shortcode: string;
  account_type: "paybill" | "till";
  environment: "sandbox" | "production";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useMpesaConfiguration(enabled: boolean = true) {
    const { activeBusinessId } = useBusiness();

    return useQuery({
        queryKey: queryKeys.mpesaConfiguration(activeBusinessId),
        queryFn: async () => {
            const data: MpesaConfiguration[] = await apiService.get("/api/v1/payments/configurations/", 
                { 
                    businessId: activeBusinessId 
                }
            );
            return data[0] ?? null;
        },
        enabled: enabled && !!activeBusinessId,
        staleTime: 10 * 60 * 1000,
    });
}