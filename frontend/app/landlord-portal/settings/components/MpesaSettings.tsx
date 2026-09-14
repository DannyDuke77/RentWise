"use client";

import { useState, useEffect } from "react";
import {
  Key, Lock, Hash, Shield, Globe, Wallet,
  Save, Loader2, CheckCircle, AlertCircle, CreditCard, Building2,
  ChevronDown, Eye, EyeOff, Info,
} from "lucide-react";
import { useMpesaConfiguration } from "@/app/hooks/queries/useMpesaConfigurationQueries";
import {
  useCreateMpesaConfiguration,
  useUpdateMpesaConfiguration,
} from "@/app/hooks/mutations/useMpesaConfigurationMutations";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import CustomTooltip from "@/app/components/ui/CustomTooltip";
import { useToast } from "@/app/providers/ToastProvider";
import { useBusiness } from "@/app/providers/BusinessProvider";
import Image from "next/image";

const emptyForm = {
  consumerKey: "",
  consumerSecret: "",
  shortcode: "",
  passkey: "",
  accountType: "paybill" as "paybill" | "till",
  environment: "sandbox" as "sandbox" | "production",
  isActive: true,
};

/** Maps backend error keys → form field names. */
const FIELD_MAP: Record<string, string> = {
  consumer_key: "consumerKey",
  consumer_secret: "consumerSecret",
  account_type: "accountType",
  is_active: "isActive",
};

export default function MpesaSettings() {
  const { activeBusinessId } = useBusiness();

  const { data: configuration, isLoading, isError } = useMpesaConfiguration();

  const createConfiguration = useCreateMpesaConfiguration();
  const updateConfiguration = useUpdateMpesaConfiguration();
  const isSubmitting =
    createConfiguration.isPending || updateConfiguration.isPending;

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [showConsumerSecret, setShowConsumerSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (!activeBusinessId) {
      setForm(emptyForm);
      setErrors({});
      return;
    }

    if (!configuration) {
      setForm(emptyForm);
      setErrors({});
      return;
    }

    setForm({
      consumerKey: configuration.consumer_key ?? "",
      consumerSecret: "",
      shortcode: configuration.shortcode ?? "",
      passkey: "",
      accountType: configuration.account_type,
      environment: configuration.environment,
      isActive: configuration.is_active,
    });

    setErrors({});
  }, [activeBusinessId, configuration]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setApiErrors = (data: any) => {
    const mapped: Record<string, string[]> = {};
    Object.entries(data ?? {}).forEach(([key, value]) => {
      const formKey = FIELD_MAP[key] ?? key;
      mapped[formKey] = Array.isArray(value) ? value : [String(value)];
    });
    setErrors(mapped);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const payload = {
      consumer_key: form.consumerKey || undefined,
      consumer_secret: form.consumerSecret || undefined,
      shortcode: form.shortcode,
      passkey: form.passkey || undefined,
      account_type: form.accountType,
      environment: form.environment,
      is_active: form.isActive,
    };

    try {
      const response = configuration
        ? await updateConfiguration.mutateAsync({
            configurationId: configuration.id,
            payload,
          })
        : await createConfiguration.mutateAsync({
            payload: {
              ...payload,
              consumer_key: form.consumerKey,
              consumer_secret: form.consumerSecret,
              passkey: form.passkey,
            },
          });

      if (response?.id) {
        showToast(
          "Success",
          "M-Pesa configuration saved successfully.",
          "success",
        );
      } else {
        setApiErrors(response);
      }
    } catch (err: any) {
      setApiErrors(err?.response?.data ?? { detail: "Something went wrong." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <LoadingSpinner
          size="lg"
          color="blue-600"
          label="Fetching M-Pesa configuration..."
          showTimer={true}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm font-medium text-red-600">
            Unable to load M-Pesa settings.
          </p>
          <p className="text-xs text-gray-500">
            Please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  const hasChanges = () => {
    if (!configuration) {
      return (
        form.consumerKey.trim() !== "" &&
        form.consumerSecret.trim() !== "" &&
        form.shortcode.trim() !== "" &&
        form.passkey.trim() !== ""
      );
    }

    return (
      form.consumerKey !== (configuration.consumer_key ?? "") ||
      form.consumerSecret !== "" ||
      form.shortcode !== (configuration.shortcode ?? "") ||
      form.passkey !== "" ||
      form.accountType !== configuration.account_type ||
      form.environment !== configuration.environment ||
      form.isActive !== configuration.is_active
    );
  };

  const baseInput =
    "w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 outline-none transition-all text-sm text-gray-900 placeholder-gray-400";

  const inputClass = (field: string) =>
    `${baseInput} ${
      errors[field]
        ? "border-red-300 focus:ring-red-100 focus:border-red-500"
        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 animate-in slide-in-from-bottom-4 duration-500"
    >
      {/* General / non-field error */}
      {errors.detail && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errors.detail[0]}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-8">
        <div className="flex items-center justify-center border border-gray-200 px-4 py-6 mb-4 rounded-3xl shadow-md">
          <Image
            src="/M-PESA.png"
            alt="M-Pesa"
            width={72}
            height={20}
            className="object-contain"
          />
        </div>
        <h3 className="text-xl font-bold text-gray-800">M-Pesa Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configure M-Pesa payments for your business
        </p>

        {configuration && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <span
              className={`w-2 h-2 rounded-full ${
                form.isActive ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
            <span className="text-xs font-medium text-emerald-700">
              {form.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        )}
      </div>

      {/* Security Notice */}
      {configuration && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Sensitive credentials are hidden
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              For security, the <strong>Consumer Secret</strong> and{" "}
              <strong>Passkey</strong> are not displayed. Leave those fields blank
              to keep your existing credentials, or enter new values to replace
              them.
            </p>
          </div>
        </div>
      )}

      {/* Credentials */}
      <section className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            API Credentials
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            From your Safaricom Daraja developer account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Consumer Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                name="consumerKey"
                value={form.consumerKey}
                onChange={handleChange}
                required={!configuration}
                placeholder="Enter consumer key"
                className={inputClass("consumerKey")}
              />
            </div>
            {errors.consumerKey && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.consumerKey[0]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Consumer Secret <span className="text-red-500">*</span>
              {configuration && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-amber-600">
                  <Lock className="w-3 h-3" />
                  Hidden for security
                </span>
              )}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showConsumerSecret ? "text" : "password"}
                name="consumerSecret"
                value={form.consumerSecret}
                onChange={handleChange}
                required={!configuration}
                placeholder={
                  configuration
                    ? "Leave blank to keep the existing secret"
                    : "Enter consumer secret"
                }
                className={`${inputClass("consumerSecret")} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConsumerSecret((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConsumerSecret ? "Hide consumer secret" : "Show consumer secret"}
              >
                {showConsumerSecret ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.consumerSecret ? (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.consumerSecret[0]}
              </p>
            ) : (
              configuration && (
                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Leave blank to keep the existing secret.
                </p>
              )
            )}
          </div>
        </div>
      </section>

      {/* Payment Details */}
      <section className="space-y-5 pt-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Payment Details
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Where customer payments will be received
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Shortcode <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                name="shortcode"
                value={form.shortcode}
                onChange={handleChange}
                required={!configuration}
                placeholder="e.g., 174379"
                className={inputClass("shortcode")}
              />
            </div>
            {errors.shortcode && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.shortcode[0]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Account Type
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                name="accountType"
                value={form.accountType}
                onChange={handleChange}
                className={`${inputClass("accountType")} appearance-none cursor-pointer pr-9`}
              >
                <option value="paybill">Paybill</option>
                <option value="till">Till</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            {errors.accountType && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.accountType[0]}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Passkey <span className="text-red-500">*</span>
              {configuration && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-amber-600">
                  <Lock className="w-3 h-3" />
                  Hidden for security
                </span>
              )}
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showPasskey ? "text" : "password"}
                name="passkey"
                value={form.passkey}
                onChange={handleChange}
                required={!configuration}
                placeholder={
                  configuration
                    ? "Leave blank to keep the existing passkey."
                    : "Enter passkey"
                }
                className={`${inputClass("passkey")} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPasskey((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPasskey ? "Hide passkey" : "Show passkey"}
              >
                {showPasskey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.passkey ? (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.passkey[0]}
              </p>
            ) : (
              configuration && (
                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Leave blank to keep the existing passkey.
                </p>
              )
            )}
          </div>
        </div>
      </section>

      {/* Environment & Toggle */}
      <section className="space-y-5 pt-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Environment
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose where transactions are sent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Environment
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                name="environment"
                value={form.environment}
                onChange={handleChange}
                className={`${inputClass("environment")} appearance-none cursor-pointer pr-9`}
              >
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            {errors.environment ? (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.environment[0]}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                Use <span className="font-medium">Sandbox</span> for testing,{" "}
                <span className="font-medium">Production</span> for live
                payments.
              </p>
            )}
          </div>

          {configuration && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <label
                className={`flex items-center gap-3 px-4 py-2.5 bg-white border rounded-lg cursor-pointer transition ${
                  errors.isActive
                    ? "border-red-300"
                    : "border-gray-200 hover:border-blue-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => {
                    setForm({ ...form, isActive: e.target.checked });
                    setErrors((prev) => {
                      if (!prev.isActive) return prev;
                      const next = { ...prev };
                      delete next.isActive;
                      return next;
                    });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Enable M-Pesa payments
                  </span>
                </div>
              </label>
              {errors.isActive && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.isActive[0]}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl -mx-6 px-6 py-4 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          {hasChanges() ? (
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-amber-500 rounded-full animate-ping" />
              <div>
                <p className="text-sm font-semibold text-amber-700">
                  Unsaved Changes
                </p>
                <p className="text-xs text-gray-500">
                  Click &quot;Save Changes&quot; to update your configuration
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-500">
                All changes saved
              </p>
            </div>
          )}
        </div>

        <div className="relative group">
          <button
            type="submit"
            disabled={isSubmitting || !hasChanges()}
            className="flex items-center justify-center gap-3 px-10 py-3.5 text-white font-semibold rounded-xl transition-all bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[200px] text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
          {!hasChanges() && (
            <CustomTooltip message="You have no unsaved changes" />
          )}
        </div>
      </div>
    </form>
  );
}