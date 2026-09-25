"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Key, Lock, Hash, Shield, Globe, Wallet, Save, Loader2,
  CheckCircle, AlertCircle, Building2, Eye, EyeOff, Info,
  Pencil, X, PowerOff,
  Dot,
} from "lucide-react";
import { useMpesaConfiguration } from "@/app/hooks/queries/useMpesaConfigurationQueries";
import {
  useCreateMpesaConfiguration,
  useUpdateMpesaConfiguration,
} from "@/app/hooks/mutations/useMpesaConfigurationMutations";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import ConfirmModal from "@/app/components/modals/ConfirmModal";
import { useToast } from "@/app/providers/ToastProvider";
import { useBusiness } from "@/app/providers/BusinessProvider";
import Toggle from "@/app/components/ui/Toggle";

type AccountType = "paybill" | "till";
type Environment = "sandbox" | "production";
type Section = "credentials" | "payment" | "environment";

interface MpesaForm {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  accountType: AccountType;
  environment: Environment;
  isActive: boolean;
}

const emptyForm: MpesaForm = {
  consumerKey: "",
  consumerSecret: "",
  shortcode: "",
  passkey: "",
  accountType: "paybill",
  environment: "sandbox",
  isActive: true,
};

const FIELD_MAP: Record<string, keyof MpesaForm> = {
  consumer_key: "consumerKey",
  consumer_secret: "consumerSecret",
  account_type: "accountType",
  environment: "environment",
  is_active: "isActive",
  shortcode: "shortcode",
  passkey: "passkey",
};

/* ------Segmented control ------*/

function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`grid gap-2 ${
        options.length === 2 ? "grid-cols-2" : `grid-cols-${options.length}`
      } ${disabled ? "opacity-70" : ""}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`relative text-left px-4 py-3 rounded-xl border transition-all ${
              active
                ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500"
                : "border-slate-200 bg-white hover:border-slate-300"
            } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-sm font-semibold ${
                  active ? "text-indigo-700" : "text-slate-700"
                }`}
              >
                {opt.label}
              </span>
              {active && (
                <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
            </div>
            {opt.hint && (
              <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------Section card ------*/

function SectionCard({
  title,
  description,
  icon: Icon,
  editing,
  canEdit,
  onEdit,
  onCancel,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  editing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`bg-white border rounded-2xl transition-colors h-[fit-content] ${
        editing ? "border-indigo-200 shadow-md shadow-indigo-100" : "border-slate-200/80 shadow-sm"
      }`}
    >
      <header className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              editing ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        {canEdit && (
          <div className="shrink-0">
            {editing ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors px-2 py-1 rounded-md hover:bg-indigo-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>
        )}
      </header>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

/* ------Main component ------*/

export default function MpesaSettings() {
  const [confirmDisable, setConfirmDisable] = useState(false);

  const { activeBusinessId, activeBusinessRole } = useBusiness();
  const { data: configuration, isLoading, isError } = useMpesaConfiguration();
  const createConfiguration = useCreateMpesaConfiguration();
  const updateConfiguration = useUpdateMpesaConfiguration();
  const isSubmitting = createConfiguration.isPending || updateConfiguration.isPending;
  const { showToast } = useToast();

  const isOwner = activeBusinessRole === "owner";

  const [form, setForm] = useState<MpesaForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [showConsumerSecret, setShowConsumerSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [replaceSecret, setReplaceSecret] = useState(false);
  const [replacePasskey, setReplacePasskey] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => {
    if (!activeBusinessId || !configuration) {
      setForm(emptyForm);
      setErrors({});
      setEditingSection(null);
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
    setEditingSection(null);
    setReplaceSecret(false);
    setReplacePasskey(false);
  }, [activeBusinessId, configuration]);

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const setApiErrors = (data: any) => {
    const mapped: Record<string, string[]> = {};
    Object.entries(data ?? {}).forEach(([key, value]) => {
      const formKey = (FIELD_MAP[key] ?? key) as string;
      mapped[formKey] = Array.isArray(value) ? (value as string[]) : [String(value)];
    });
    setErrors(mapped);
  };

  const cancelSection = () => {
    setForm(
      configuration
        ? {
            consumerKey: configuration.consumer_key ?? "",
            consumerSecret: "",
            shortcode: configuration.shortcode ?? "",
            passkey: "",
            accountType: configuration.account_type,
            environment: configuration.environment,
            isActive: configuration.is_active,
          }
        : emptyForm
    );
    setErrors({});
    setReplaceSecret(false);
    setReplacePasskey(false);
    setEditingSection(null);
  };

  const sectionLabel = (section: Section | null) =>
    section === "credentials"
      ? "API credentials"
      : section === "payment"
        ? "payment details"
        : section === "environment"
          ? "environment"
          : "";

  const hasChanges = (): boolean => {
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isOwner || !editingSection) return;
    if (!hasChanges()) return;
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

      console.log("response", response);

      if (response.success) {
        showToast("Success", "M-Pesa configuration saved successfully.", "success");
        setEditingSection(null);
        setReplaceSecret(false);
        setReplacePasskey(false);
      } else {
        showToast("Error", response?.detail, "error");
        setApiErrors(response);
      }
    } catch (err: any) {
      setApiErrors(err?.response?.data ?? { detail: "Something went wrong." });
    }
  };

  const applyActiveChange = async (checked: boolean) => {
    if (!configuration) return;
    setForm((prev) => ({ ...prev, isActive: checked }));
    try {
      const res = await updateConfiguration.mutateAsync({
        configurationId: configuration.id,
        payload: { is_active: checked },
      });
      if (res.success) {
        showToast(
          "Success",
          checked ? "M-Pesa payments enabled." : "M-Pesa payments disabled.",
          "success"
        );
      }
    } catch {
      setForm((prev) => ({ ...prev, isActive: !checked }));
      showToast("Error", "Could not update status.", "error");
    }
  };

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      applyActiveChange(true);
      return;
    }
    setConfirmDisable(true);
  };

  const confirmDisableAndSave = async () => {
    await applyActiveChange(false);
    setConfirmDisable(false);
  };

  /* ------Early states ------*/

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <LoadingSpinner size="lg" color="indigo-600" label="Loading M-Pesa settings..." showTimer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm font-medium text-red-600">Unable to load M-Pesa settings.</p>
          <p className="text-xs text-gray-500">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  const isConfigured = !!configuration;
  const isEditing = editingSection !== null;

  const fieldBase = "w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm transition-all outline-none bg-white text-slate-900 placeholder:text-slate-400 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";
  const fieldWithError = (field: keyof MpesaForm) =>
    errors[field] ? "border-red-300 focus:ring-red-100 focus:border-red-500" : "";

  const FieldError = ({ field }: { field: keyof MpesaForm }) =>
    errors[field] ? (
      <p className="mt-1.5 text-xs text-red-600">{errors[field][0]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-700/90 shadow-md">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 px-5 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* M-Pesa Logo Container */}
            <div className="h-20 w-20 rounded-2xl bg-white ring-4 ring-white/30 shadow-xl flex items-center justify-center shrink-0 p-2.5 transition-transform hover:scale-[1.02]">
              <Image
                src="/M-PESA.png"
                alt="M-Pesa"
                width={70}
                height={24}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            {/* Metadata & Status */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  M-Pesa Configuration
                </h1>

                {isConfigured && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md ${
                      form.isActive
                        ? "bg-emerald-950/40 text-emerald-100 border-emerald-400/40"
                        : "bg-slate-900/40 text-slate-200 border-white/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        form.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </div>

              <p className="text-sm text-emerald-100/90 mt-1 flex flex-wrap items-center font-medium">
                {isConfigured ? (
                  <>
                    <span>
                      Connected to{" "}
                      <strong className="text-white capitalize">
                        {configuration.account_type === "paybill" ? "Paybill" : "Till"}
                      </strong>
                    </span>
                    <Dot className="w-6 h-6" />
                    <span className="font-mono text-white">
                      {configuration.shortcode}
                    </span>
                  </>
                ) : (
                  "Configure M-Pesa payments for your business"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Non-owner notice */}
      {!isOwner && isConfigured && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-700">Read-only view</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Only the business owner can change M-Pesa settings.
            </p>
          </div>
        </div>
      )}

      {/* Enable / disable card (only if configured) */}
      {isConfigured && (
        <div
          className={`rounded-2xl border p-5 flex items-center justify-between gap-4 transition-colors ${
            form.isActive
              ? "bg-emerald-50/50 border-emerald-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                form.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {form.isActive ? "Accepting payments" : "Payments paused"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {form.isActive
                  ? "Customers can pay via M-Pesa right now."
                  : "Customers won't be able to pay via M-Pesa."}
              </p>
            </div>
          </div>

          <Toggle
            checked={form.isActive}
            disabled={!isOwner || isSubmitting}
            aria-label="Toggle M-Pesa payments"
            onChange={handleToggleChange}
          />
        </div>
      )}

      {/* Security explainer */}
      {isConfigured && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-800">
          <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            <strong className="font-semibold">Your secret</strong> and{" "}
            <strong className="font-semibold">passkey</strong> are stored encrypted and never sent back to this page. To replace one, click Replace and enter a new value.
          </p>
        </div>
      )}
      
      {/* Credentials card */}
      <SectionCard
        title="API credentials"
        description="From your Safaricom Daraja developer account"
        icon={Key}
        editing={editingSection === "credentials"}
        canEdit={isOwner}
        onEdit={() => setEditingSection("credentials")}
        onCancel={cancelSection}
      >
        {editingSection === "credentials" ? (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Consumer Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  name="consumerKey"
                  value={form.consumerKey}
                  onChange={handleChange}
                  required={!isConfigured}
                  placeholder="Enter consumer key"
                  className={`${fieldBase} ${fieldWithError("consumerKey")}`}
                />
              </div>
              <FieldError field="consumerKey" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Consumer Secret <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type={showConsumerSecret ? "text" : "password"}
                  name="consumerSecret"
                  value={form.consumerSecret}
                  onChange={handleChange}
                  required={!isConfigured}
                  placeholder={isConfigured ? "Enter new secret to replace" : "Enter consumer secret"}
                  className={`${fieldBase} ${fieldWithError("consumerSecret")} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConsumerSecret((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConsumerSecret ? "Hide" : "Show"}
                >
                  {showConsumerSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError field="consumerSecret" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ReadRow
              icon={Key}
              label="Consumer Key"
              value={form.consumerKey || "—"}
              masked={false}
            />
            <ReadRow
              icon={Lock}
              label="Consumer Secret"
              value={isConfigured ? "••••••••••••" : "—"}
              masked={isConfigured}
            />
            {!isConfigured && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Click Edit to add your credentials.
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment details card */}
        <SectionCard
          title="Payment details"
          description="Where customer payments land"
          icon={Building2}
          editing={editingSection === "payment"}
          canEdit={isOwner}
          onEdit={() => setEditingSection("payment")}
          onCancel={cancelSection}
        >
          {editingSection === "payment" ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Shortcode <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    name="shortcode"
                    value={form.shortcode}
                    onChange={handleChange}
                    required={!isConfigured}
                    placeholder="e.g., 174379"
                    className={`${fieldBase} ${fieldWithError("shortcode")}`}
                  />
                </div>
                <FieldError field="shortcode" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account type
                </label>
                <Segmented
                  value={form.accountType}
                  onChange={(v) => setForm((p) => ({ ...p, accountType: v }))}
                  options={[
                    { value: "paybill", label: "Paybill", hint: "Business number" },
                    { value: "till", label: "Till", hint: "Buy Goods" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Passkey <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type={showPasskey ? "text" : "password"}
                    name="passkey"
                    value={form.passkey}
                    onChange={handleChange}
                    required={!isConfigured}
                    placeholder={isConfigured ? "Enter new passkey to replace" : "Enter passkey"}
                    className={`${fieldBase} ${fieldWithError("passkey")} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPasskey ? "Hide" : "Show"}
                  >
                    {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError field="passkey" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ReadRow
                icon={Building2}
                label="Account type"
                value={form.accountType === "paybill" ? "Paybill" : "Till"}
              />
              <ReadRow icon={Hash} label="Shortcode" value={form.shortcode || "—"} />
              <ReadRow
                icon={Shield}
                label="Passkey"
                value={isConfigured ? "••••••••••••" : "—"}
                masked={isConfigured}
              />
            </div>
          )}
        </SectionCard>

        {/* Environment card */}
        <SectionCard
          title="Environment"
          description="Where transactions are sent"
          icon={Globe}
          editing={editingSection === "environment"}
          canEdit={isOwner}
          onEdit={() => setEditingSection("environment")}
          onCancel={cancelSection}
        >
          {editingSection === "environment" ? (
            <Segmented
              value={form.environment}
              onChange={(v) => setForm((p) => ({ ...p, environment: v }))}
              options={[
                { value: "sandbox", label: "Sandbox", hint: "For testing — no real money" },
                { value: "production", label: "Production", hint: "Live payments" },
              ]}
            />
          ) : (
            <ReadRow
              icon={Globe}
              label="Environment"
              value={form.environment === "production" ? "Production" : "Sandbox"}
            />
          )}
        </SectionCard>
      </div>

      {/* Contextual sticky bar (only when editing) */}
      {isEditing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xl shadow-slate-900/30">
            <div className="flex items-center gap-2.5 min-w-0">
              {hasChanges() ? (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
              )}
              <p className="text-sm text-slate-200 truncate">
                {hasChanges() ? (
                  <>
                    Editing{" "}
                    <span className="font-semibold text-white">
                      {sectionLabel(editingSection)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-white">
                      {sectionLabel(editingSection)}
                    </span>{" "}
                    — no changes yet
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={cancelSection}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !hasChanges()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-slate-700 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDisable}
        icon={
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
            <PowerOff size={18} />
          </div>
        }
        title="Pause M-Pesa payments?"
        message="Tenants won't be able to start new M-Pesa payments until you turn this back on."
        message2="Payments already in progress will still complete."
        confirmText="Pause payments"
        confirmColor="bg-amber-600 hover:bg-amber-700"
        isLoading={isSubmitting}
        onConfirm={confirmDisableAndSave}
        onClose={() => setConfirmDisable(false)}
      />
    </form>
  );
}

/* ------Read-only row ------*/

function ReadRow({
  icon: Icon,
  label,
  value,
  masked,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  masked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <span
        className={`text-sm font-medium text-slate-900 truncate ${
          masked ? "font-mono tracking-tight" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}