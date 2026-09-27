"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CreditCard,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Building2,
  SquarePen,
  Type,
  CheckCircle,
} from "lucide-react";
import { useInitiateTenantPayment } from "@/app/hooks/mutations/useTenantPaymentMutations";
import { useTenantPaymentStatus } from "@/app/hooks/queries/useTenantPaymentsQueries";
import Modal from "../ui/Modal";
import Image from "next/image";
import { TenantProfile, TenantTenancy } from "@/app/src/types/Types";
import { useToast } from "@/app/providers/ToastProvider";

type TenantPaymentModalProps = {
  tenant: TenantProfile;
  onClose: () => void;
  onPaymentSuccess?: () => void;
};

export default function TenantPaymentModal({
  tenant,
  onClose,
  onPaymentSuccess,
}: TenantPaymentModalProps) {
  const { showToast } = useToast();
  
  // Only tenancies that can actually receive M-Pesa payments.
  const payableTenancies = useMemo(
    () => tenant.tenancies.filter((t: TenantTenancy) => t.mpesa_available),
    [tenant.tenancies]
  );

  const [tenancyId, setTenancyId] = useState(
    payableTenancies.length === 1 ? payableTenancies[0].id : ""
  );
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(tenant.phone);
  const [category, setCategory] = useState<"rent" | "deposit">("rent");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const initiatePayment = useInitiateTenantPayment();

  const [transactionId, setTransactionId] = useState<string | null>(null);
  const paymentStatus = useTenantPaymentStatus(transactionId);
  const status = paymentStatus.data?.status;

  const isProcessing = transactionId !== null && (!paymentStatus.data || status === "pending");
  const isPaymentSuccessful = status === "success";
  const isPaymentFailed = status === "failed" || status === "cancelled";
  const paymentSuccessHandled = useRef(false);

  const selectedTenancy = payableTenancies.find((t: TenantTenancy) => t.id === tenancyId);

  useEffect(() => {
    setErrors({});
  }, [tenancyId, amount, phoneNumber, category]);

  useEffect(() => {
    if (initiatePayment.isSuccess) setNotes("");
  }, [initiatePayment.isSuccess]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors: Record<string, string[]> = {};
    if (!tenancyId) newErrors.tenancy_id = ["Please select a tenancy"];
    if (!amount || Number(amount) <= 0)
      newErrors.amount = ["Please enter a valid amount"];
    if (!phoneNumber || phoneNumber.length < 10)
      newErrors.phone_number = ["Please enter a valid phone number"];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await initiatePayment.mutateAsync({
          tenancy_id: tenancyId,
          phone_number: phoneNumber,
          amount,
          category,
          notes: notes.trim(),
      });

      paymentSuccessHandled.current = false;
      setTransactionId(response.transaction_id);

      showToast("Success", "Payment initiated successfully", "success");
    } catch (error) {
      showToast("Error", getErrorMessage(error) || "Something went wrong", "error");
      console.error("Payment initiation failed:", error);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    const axiosErr = error as { response?: { data?: any } };
    const data = axiosErr?.response?.data;

    if (!data)
      return "Couldn't reach the server. Check your connection and try again.";
    if (typeof data.detail === "string") return data.detail;

    const first = Object.values(data).find(
      (v) => Array.isArray(v) && v.length > 0
    ) as string[] | undefined;
    if (first) return first[0];
    if (typeof data === "string") return data;
    return "Something went wrong. Please try again.";
  };


  useEffect(() => {
    if (paymentStatus.data?.status !== "success" || paymentSuccessHandled.current) {
      return;
    }

    paymentSuccessHandled.current = true;
    showToast("Payment Successful", "Your payment has been received.", "success");
    onPaymentSuccess?.();
  }, [paymentStatus.data?.status]);

  const inputClass = (field: string) =>
    `w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
      errors[field]
        ? "border-red-300 bg-red-50/40"
        : "border-gray-200 bg-white hover:border-gray-300"
    }`;

  // If no payable tenancy - don't show the form at all.
  if (payableTenancies.length === 0) {
    return (
      <Modal
        label="Initiate Payment"
        isOpen={true}
        close={onClose}
        maxWidth="max-w-md"
        content={
          <div className="p-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm font-medium text-slate-900">
              M-Pesa is not available
            </p>
            <p className="text-xs text-slate-500">
              Your landlord has paused M-Pesa payments. Please contact them to
              arrange payment.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        }
      />
    );
  }

  const content = (
    <div className="p-6 space-y-5">
      {isPaymentSuccessful ? (
        <div className="flex flex-col items-center gap-3 text-center py-6">
          <div className="relative">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
          </div>

          <p className="text-sm font-semibold text-slate-900">
            Payment Successful
          </p>

          <p className="text-xs text-slate-500 max-w-xs">
            Your payment of{" "}
            <span className="font-medium text-slate-700">
              KES {Number(amount).toLocaleString()}
            </span>{" "}
            has been received successfully.
          </p>

          {paymentStatus.data?.mpesa_receipt_number && (
            <p className="text-xs text-slate-500">
              M-Pesa receipt:{" "}
              <span className="font-medium text-slate-700">
                {paymentStatus.data.mpesa_receipt_number}
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            Done
          </button>
        </div>
      ) : isPaymentFailed ? (
        <div className="flex flex-col items-center gap-3 text-center py-6">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>

          <p className="text-sm font-semibold text-slate-900">
            Payment Failed
          </p>

          <p className="text-xs text-slate-500 max-w-xs">
            {paymentStatus.data?.result_description ||
              "The M-Pesa payment could not be completed."}
          </p>

          <button
            type="button"
            onClick={() => {
              setTransactionId(null);
            }}
            className="mt-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Try Again
          </button>
        </div>
      ) : transactionId ? (
        <div className="flex flex-col items-center gap-3 text-center py-6">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          </div>

          <p className="text-sm font-semibold text-slate-900">
            Waiting for payment
          </p>

          <p className="text-xs text-slate-500 max-w-xs">
            An M-Pesa prompt has been sent to{" "}
            <span className="font-medium text-slate-700">
              {phoneNumber}
            </span>
            . Enter your M-Pesa PIN to complete the payment.
          </p>

          <p className="text-[11px] text-slate-400">
            Waiting for M-Pesa confirmation...
          </p>
        </div>
    ) : (
      <>
        {/* Header */}
        <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
          <div className="shrink-0 p-1 bg-white rounded-lg border border-slate-200/60 shadow-xs">
            <Image
              src="/M-PESA.png"
              alt="M-Pesa"
              width={60}
              height={16}
              className="object-contain h-12 w-auto"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
              Pay via M-Pesa
            </h2>
            <p className="text-[11px] text-slate-500">
              STK push prompt will be sent to your phone
            </p>
          </div>
        </div>

        {/* Error */}
        {initiatePayment.isError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">
              {getErrorMessage(initiatePayment.error)}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {payableTenancies.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Tenancy
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={tenancyId}
                  onChange={(e) => {
                    setTenancyId(e.target.value);
                    clearError("tenancy_id");
                  }}
                  className={`${inputClass(
                    "tenancy_id"
                  )} appearance-none pr-9 cursor-pointer`}
                >
                  <option value="">Select a tenancy</option>
                  {payableTenancies.map((t: TenantTenancy) => (
                    <option key={t.id} value={t.id}>
                      {t.property} • {t.unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.tenancy_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.tenancy_id[0]}
                </p>
              )}
            </div>
          )}

          {/* Tenancy summary */}
          {selectedTenancy && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {selectedTenancy.property} • {selectedTenancy.unit}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap ml-3">
                KES {Number(selectedTenancy.balance).toLocaleString()}
              </span>
            </div>
          )}

          {/* Amount + Type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
                  KES
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    clearError("amount");
                  }}
                  placeholder="0"
                  className={`${inputClass("amount")} pl-12`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Type
              </label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as "rent" | "deposit")
                  }
                  className={`${inputClass(
                    "category"
                  )} pl-3 pr-7 appearance-none cursor-pointer`}
                >
                  <option value="rent">Rent</option>
                  <option value="deposit">Deposit</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              M-Pesa phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  clearError("phone_number");
                }}
                placeholder="2547XXXXXXXX"
                className={inputClass("phone_number")}
              />
            </div>
            {errors.phone_number && (
              <p className="mt-1 text-xs text-red-600">
                {errors.phone_number[0]}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Notes{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <SquarePen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. October rent"
                maxLength={100}
                className={`${inputClass("notes")} pl-3`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={initiatePayment.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {initiatePayment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay
                </>
              )}
            </button>
          </div>
        </form>
      </>
    )}
    </div>
  );

  return (
    <Modal
      label="Initiate Payment"
      isOpen={true}
      close={onClose}
      content={content}
      maxWidth="max-w-md"
    />
  );
}