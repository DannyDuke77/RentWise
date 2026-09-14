"use client";

import { useState, useEffect } from "react";
import { TenantProfile } from "@/app/hooks/queries/useTenantPortalQueries";
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
} from "lucide-react";
import { useInitiateTenantPayment } from "@/app/hooks/mutations/useTenantPaymentMutations";
import Modal from "../ui/Modal";
import Image from "next/image";

type TenantPaymentModalProps = {
  tenant: TenantProfile;
  onClose: () => void;
};

export default function TenantPaymentModal({
  tenant,
  onClose,
}: TenantPaymentModalProps) {
  const [tenancyId, setTenancyId] = useState(
    tenant.tenancies.length === 1 ? tenant.tenancies[0].id : ""
  );
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(tenant.phone);
  const [category, setCategory] = useState<"rent" | "deposit">("rent");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const initiatePayment = useInitiateTenantPayment();

  const selectedTenancy = tenant.tenancies.find(
    (tenancy) => tenancy.id === tenancyId
  );

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

  const handleSubmit = (event: React.FormEvent) => {
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

    initiatePayment.mutate({
      tenancy_id: tenancyId,
      phone_number: phoneNumber,
      amount,
      category,
      notes: notes.trim(),
    });
  };

  const inputClass = (field: string) =>
    `w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
      errors[field]
        ? "border-red-300 bg-red-50/40"
        : "border-gray-200 bg-white hover:border-gray-300"
    }`;

  const content = (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="">
          <Image
            src="/M-PESA.png"
            alt="M-Pesa"
            width={72}
            height={20}
            className="object-contain h-25 w-25"
          />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Pay via M-Pesa</h2>
          <p className="text-xs text-gray-500">
            You'll receive an M-Pesa prompt to authorise
          </p>
        </div>
      </div>

      {/* Success / Error banners */}
      {initiatePayment.isSuccess && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-700">
            Prompt sent. Enter your M-Pesa PIN on your phone to complete the
            payment.
          </p>
        </div>
      )}

      {initiatePayment.isError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">
            Couldn&apos;t send prompt. Check your details and try again.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tenancy (only if more than one) */}
        {tenant.tenancies.length > 1 && (
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
                className={`${inputClass("tenancy_id")} appearance-none pr-9 cursor-pointer`}
              >
                <option value="">Select a tenancy</option>
                {tenant.tenancies.map((t) => (
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

        {/* Tenancy summary — compact single line */}
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
                className={`${inputClass("category")} pl-3 pr-7 appearance-none cursor-pointer`}
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