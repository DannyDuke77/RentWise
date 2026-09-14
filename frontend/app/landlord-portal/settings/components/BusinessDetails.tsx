'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Upload, Mail, Phone, MapPin, Save, Building2, X,
  CheckCircle, Building, Globe, AlertCircle, ChevronDown,
} from "lucide-react";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { useUpdateBusiness } from "@/app/hooks/mutations/useBusinessMutations";
import { useToast } from "@/app/providers/ToastProvider";
import { useBusiness } from "@/app/providers/BusinessProvider";

const CURRENCIES = ["KES"];

const emptyForm = {
  company_name: "",
  email: "",
  phone: "",
  address: "",
  currency: "KES",
};

const BusinessDetails = () => {
  const { activeBusiness, activeBusinessId, activeBusinessRole, isLoading, } = useBusiness();

  const updateBusiness = useUpdateBusiness();
  const { showToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!activeBusiness) return;

    setForm({
      company_name: activeBusiness.company_name ?? "",
      email: activeBusiness.email ?? "",
      phone: activeBusiness.phone ?? "",
      address: activeBusiness.address ?? "",
      currency: activeBusiness.currency ?? "KES",
    });

    setCurrentLogo(activeBusiness.logo ?? null);
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
  }, [activeBusiness]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));

    showToast("Logo selected", 'Click "Save Changes" to update your logo.', "info");
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const hasChanges = () => {
    if (!activeBusiness) return false;

    const baseline = {
      company_name: activeBusiness.company_name ?? "",
      email: activeBusiness.email ?? "",
      phone: activeBusiness.phone ?? "",
      address: activeBusiness.address ?? "",
      currency: activeBusiness.currency ?? "KES",
    };

    const formHasChanges =
      JSON.stringify(form) !== JSON.stringify(baseline);

    const logoHasChanges = logoFile !== null;

    return formHasChanges || logoHasChanges;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeBusinessId) {
      showToast("Error", "No active business selected.", "error");
      return;
    }

    if (activeBusinessRole !== "owner") {
      showToast("Permission denied", "Only business owners can update business details.", "error");
      return;
    }

    setErrors({});

    let payload: FormData | typeof form = logoFile
      ? new FormData()
      : { ...form };

    if (logoFile && payload instanceof FormData) {
      Object.entries(form).forEach(([key, value]) => {
        payload.append(key, value);
      });

      payload.append("logo", logoFile);
    }

    try {
      const response = await updateBusiness.mutateAsync({
        businessId: activeBusinessId,
        payload,
      });

      if (response?.id) {
        showToast(
          "Business Updated!",
          "Your business profile has been saved successfully.",
          "success"
        );

        setCurrentLogo(response.logo ?? null);
        setLogoFile(null);
        setLogoPreview(null);
      } else {
        showToast(
          "Error",
          response?.detail ||
            "Something went wrong. Please try again.",
          "error"
        );
      }
    } catch (err: any) {
      console.log("Response:", err);

      setErrors(err?.response ?? {});

      showToast(
        "Error",
        err?.response?.detail ||
          "Something went wrong. Please try again.",
        "error"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <LoadingSpinner
          size="lg"
          color="blue-600"
          label="Loading business details..."
          showTimer={true}
        />
      </div>
    );
  }

  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
        <div className="p-6 bg-white rounded-full shadow-lg shadow-gray-100 mb-6">
          <Building2 className="w-12 h-12 text-gray-300" />
        </div>

        <h4 className="text-lg font-semibold text-gray-700">
          No Business Selected
        </h4>

        <p className="text-sm text-gray-400 mt-1">
          Select a business from the sidebar to manage its details.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-900";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Message */}
        {(errors.detail || errors.logo) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

            <p className="text-sm text-red-700">
              {errors.detail || errors.logo}
            </p>
          </div>
        )}

        {/* Header with Logo */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="relative group">
            <div className="w-28 h-28 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden hover:border-blue-400 transition-colors">
              {logoPreview || currentLogo ? (
                <>
                  <Image
                    src={logoPreview ?? currentLogo!}
                    alt={`${form.company_name} Logo`}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-1 right-1 p-1 z-20 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <Building className="w-10 h-10 text-gray-300 mx-auto" />

                  <p className="text-xs text-gray-400 mt-1">
                    Add Logo
                  </p>
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="absolute opacity-0 z-10 inset-0 cursor-pointer"
            />
          </div>

          <div className="flex-1">
            <h4 className="text-lg sm:text-2xl font-bold text-gray-900">
              {form.company_name || "Untitled Business"}
            </h4>

            <p className="text-sm text-gray-500 mt-0.5">
              {form.email || "No email set"}
            </p>

            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Click logo to upload
              </span>

              <span className="text-xs text-gray-400 flex items-center gap-1">
                PNG, JPG up to 5MB
              </span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />

              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Business Information
              </h3>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Name{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                  <input
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your company name"
                    required
                  />
                </div>

                {errors.company_name && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.company_name[0]}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="hello@company.com"
                    required
                  />
                </div>

                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.email[0]}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>

                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.phone[0]}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[100px] pt-3 resize-none`}
                    placeholder="123 Business Way, City, Country"
                  />
                </div>

                {errors.address && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.address[0]}
                  </p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Default Currency{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none cursor-pointer`}
                    required
                  >
                    <option value="">Select currency</option>

                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {errors.currency && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.currency[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
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
                    Click "Save Changes" to update your profile
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

          <button
            type="submit"
            disabled={
              updateBusiness.isPending ||
              !hasChanges()
            }
            className="flex items-center justify-center gap-3 px-10 py-3.5 text-white font-semibold rounded-xl transition-all bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[200px] text-base"
          >
            <Save className="w-5 h-5" />

            {updateBusiness.isPending
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessDetails;