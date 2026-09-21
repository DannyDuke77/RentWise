'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { useCreateBusiness } from "@/app/hooks/mutations/useBusinessMutations";
import { useBusiness } from "@/app/providers/BusinessProvider";

const BusinessOnboardingPage = () => {
  const router = useRouter();
  const createBusiness = useCreateBusiness();
  const { setActiveBusinessId } = useBusiness();

  const [form, setForm] = useState({
    company_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const created = await createBusiness.mutateAsync({
        company_name: form.company_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });

      if (created?.id) {
        setActiveBusinessId(created.id);
        router.push("/properties");
      }
    } catch (error: any) {
      console.error("Business creation error:", error);
      setErrors(
        error?.response?.data ||
          error?.response || { detail: "Something went wrong. Please try again." }
      );
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-900/5";
  const inputBorder = (hasError: boolean) =>
    hasError
      ? "border-red-300 focus:border-red-500"
      : "border-slate-200 focus:border-slate-900";

  const labelBase =
    "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-sm mb-5">
            <Building2 className="w-6 h-6 text-slate-700" />
          </div>

          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/70 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
              Step 1 of 1
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Create your business
          </h1>
          <p className="mt-2.5 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            Your business is your workspace. Once created, you can add
            properties, units, and tenants inside it.
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-900/[0.04] p-6 sm:p-8 space-y-5"
        >
          {errors.detail && (
            <div className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700">
              {Array.isArray(errors.detail) ? errors.detail[0] : errors.detail}
            </div>
          )}

          <div>
            <label htmlFor="company_name" className={labelBase}>
              Business name <span className="text-red-500">*</span>
            </label>
            <input
              id="company_name"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              className={`${inputBase} ${inputBorder(!!errors.company_name)}`}
              placeholder="Apex Property Holdings"
              required
            />
            {errors.company_name && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.company_name[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={labelBase}>
              Business email{" "}
              <span className="text-slate-400 normal-case font-normal">
                (optional)
              </span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`${inputBase} ${inputBorder(!!errors.email)}`}
              placeholder="contact@company.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600">{errors.email[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className={labelBase}>
              Phone{" "}
              <span className="text-slate-400 normal-case font-normal">
                (optional)
              </span>
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={`${inputBase} ${inputBorder(!!errors.phone)}`}
              placeholder="+254 700 000 000"
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-red-600">{errors.phone[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="address" className={labelBase}>
              Address{" "}
              <span className="text-slate-400 normal-case font-normal">
                (optional)
              </span>
            </label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className={`${inputBase} ${inputBorder(
                !!errors.address
              )} resize-none`}
              placeholder="Nairobi, Kenya"
            />
            {errors.address && (
              <p className="mt-1.5 text-xs text-red-600">{errors.address[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !form.company_name.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Creating..." : "Create business"}
          </button>

          <p className="text-center text-xs text-slate-500">
            You can invite team members and change details later.
          </p>
        </form>
      </div>
    </div>
  );
};

export default BusinessOnboardingPage;