"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { User, Mail, Phone, MapPin, Save, Loader2, Camera } from "lucide-react";
import apiService from "@/app/services/apiService";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

const UserSettings = () => {
  // ... (State logic remains the same as your original file)
  const [form, setForm] = useState({ name: "", email: "", phone_number: "", address: "" });
  const [initialForm, setInitialForm] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await apiService.get("/api/auth/settings/user-settings/");
        setForm({
          name: data?.name ?? "",
          email: data?.email ?? "",
          phone_number: data?.phone_number ?? "",
          address: data?.address ?? "",
        });
        setInitialForm(data);
        setCurrentAvatar(data?.avatar_url ?? null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const hasChanges = () => {
    if (!initialForm) return false;
    return form.name !== initialForm.name || form.email !== initialForm.email ||
      form.phone_number !== initialForm.phone_number || form.address !== initialForm.address || avatarFile !== null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let payload: any = avatarFile ? new FormData() : { ...form };
    if (avatarFile) {
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append("avatar", avatarFile);
    }
    try {
      await apiService.patch("/api/auth/settings/user-settings/", payload);
      setInitialForm({ ...form });
      if (avatarFile) {
        setCurrentAvatar(avatarPreview);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
      alert("Personal settings updated!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading User Settings" />;

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-8">
        <div className="relative h-28 w-28 rounded-full ring-4 ring-indigo-50 overflow-hidden bg-indigo-100 flex items-center justify-center mb-4 group cursor-pointer">
          {avatarPreview || currentAvatar ? (
            <Image src={avatarPreview ?? currentAvatar!} alt="User Avatar" fill className="object-cover" unoptimized />
          ) : (
            <User className="text-indigo-300" size={40} />
          )}
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white" size={24} />
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>
        <h3 className="text-xl font-bold text-gray-800">{form.name || "User Profile"}</h3>
        <p className="text-sm text-gray-500">Update your personal information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="John Doe" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="john@example.com" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input name="phone_number" value={form.phone_number} onChange={handleChange} className={inputClass} placeholder="+1 234..." />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Physical Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
            <textarea name="address" value={form.address} onChange={handleChange} className={`${inputClass} min-h-[100px] pt-3`} placeholder="Your home address..." />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={!hasChanges() || saving}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200 active:scale-95"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? "Updating..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
};

export default UserSettings;