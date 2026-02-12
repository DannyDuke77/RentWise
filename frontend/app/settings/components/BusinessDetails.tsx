"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, Mail, Phone, MapPin, Landmark, Save, Loader2, Building2 } from "lucide-react";
import apiService from "@/app/services/apiService";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

const CURRENCIES = ["KES", "USD", "EUR"];

const BusinessDetails = () => {
  const [form, setForm] = useState({ company_name: "", email: "", phone: "", address: "", currency: "" });
  const [initialForm, setInitialForm] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiService.get("/api/auth/settings/business-profile/");
        setForm({
          company_name: data?.company_name ?? "",
          email: data?.email ?? "",
          phone: data?.phone ?? "",
          address: data?.address ?? "",
          currency: data?.currency ?? "",
        });
        setInitialForm(data);
        setCurrentLogo(data?.logo_url ?? null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const hasChanges = () => {
    if (!initialForm) return false;
    return JSON.stringify(form) !== JSON.stringify({
      company_name: initialForm.company_name ?? "",
      email: initialForm.email ?? "",
      phone: initialForm.phone ?? "",
      address: initialForm.address ?? "",
      currency: initialForm.currency ?? "",
    }) || logoFile !== null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    let payload: any = logoFile ? new FormData() : { ...form };
    if (logoFile) {
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append("logo", logoFile);
    }
    try {
      await apiService.patch("/api/auth/settings/business-profile/", payload);
      setInitialForm({ ...form });
      if (logoFile) {
        setCurrentLogo(logoPreview);
        setLogoFile(null);
        setLogoPreview(null);
      }
      alert("Business profile saved!");
    } catch (err: any) {
      setErrors(err?.response ?? {});
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Business Details" />;

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-8">
        <div className="relative h-24 w-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group">
          {logoPreview || currentLogo ? (
            <Image src={logoPreview ?? currentLogo!} alt="Logo" fill className="object-contain p-2" unoptimized />
          ) : (
            <Upload className="text-gray-300" />
          )}
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Company Logo</h4>
          <p className="text-xs text-gray-500 mb-3">PNG, JPG up to 2MB</p>
          <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
            <input name="company_name" value={form.company_name} onChange={handleChange} className={inputClass} placeholder="Acme Corp" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="hello@acme.com" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+1..." />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
            <textarea name="address" value={form.address} onChange={handleChange} className={`${inputClass} min-h-[100px] pt-3`} placeholder="123 Business Way..." />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
          <div className="relative">
            <Landmark className="absolute left-3 top-3 text-gray-400" size={18} />
            <select name="currency" value={form.currency} onChange={handleChange} className={inputClass}>
              <option value="">Select currency</option>
              {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!hasChanges() || saving}
        className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 active:scale-95"
      >
        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        {saving ? "Saving..." : "Update Profile"}
      </button>
    </form>
  );
};

export default BusinessDetails;