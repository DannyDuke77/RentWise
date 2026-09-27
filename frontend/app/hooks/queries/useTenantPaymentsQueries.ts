import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";
import { PaginatedPayments } from "@/app/src/types/Types";

export function useTenantPayments(
  page: number = 1,
  pageSize: number = 10,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.tenantPayments(page, pageSize),
    queryFn: async () => {
      const data: PaginatedPayments = await apiService.get(`/api/tenant/payments/?page=${page}&page_size=${pageSize}`);
      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

type TenantPaymentStatusResponse = {
  transaction_id: string;
  status: "pending" | "success" | "failed" | "cancelled";
  result_code: number | null;
  result_description: string | null;
  mpesa_receipt_number: string | null;
  completed_at: string | null;
};

export function useTenantPaymentStatus(transactionId: string | null) {
  return useQuery({
    queryKey: ["tenant-payment-status", transactionId],
    queryFn: async () => {
      if (!transactionId) {
        throw new Error("Transaction ID is required");
      }

      const data: TenantPaymentStatusResponse = await apiService.get(`/api/v1/payments/transactions/${transactionId}/status/`);
      return data;
    },
    enabled: !!transactionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" ? 3000 : false;
    },
    refetchOnWindowFocus: false,
  });
}