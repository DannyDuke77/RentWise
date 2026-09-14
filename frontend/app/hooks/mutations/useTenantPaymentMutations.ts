import { useMutation } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";

type InitiateTenantPaymentPayload = {
  tenancy_id: string;
  phone_number: string;
  amount: string;
  category: "rent" | "deposit";
  notes?: string;
};

type InitiateTenantPaymentResponse = {
  success: boolean;
  message: string;
  transaction_id: string;
  checkout_request_id: string;
  status: string;
};

function normalizeKenyanPhoneNumber(phoneNumber: string): string {
  const phone = phoneNumber.trim().replace(/\s+/g, "");
  if (phone.startsWith("+254")) {
    return `254${phone.slice(4)}`;
  }
  if (phone.startsWith("0")) {
    return `254${phone.slice(1)}`;
  }
  return phone;
}

export function useInitiateTenantPayment() {
  return useMutation({
    mutationFn: async (
      payload: InitiateTenantPaymentPayload
    ) => {
      const data: InitiateTenantPaymentResponse = await apiService.post("/api/v1/payments/initiate/",
          {
            ...payload,
            phone_number: normalizeKenyanPhoneNumber(
              payload.phone_number
            ),
          }
        );

      return data;
    },
  });
}