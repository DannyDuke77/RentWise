"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Dot,
  Trash,
} from "lucide-react";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { useUserProfile } from "@/app/hooks/queries/useSettingsQueries";
import { useUpdateUserProfile } from "@/app/hooks/mutations/useSettingsMutations";
import CustomTooltip from "@/app/components/ui/CustomTooltip";
import { useToast } from "@/app/providers/ToastProvider";

const emptyForm = { name: "", email: "", phone_number: "", address: "" };

const inputBase = "w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none";

const UserSettings = () => {
  const { data: user, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const { showToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!user || hasHydrated.current) return;
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone_number: user.phone_number ?? "",
      address: user.address ?? "",
    });
    setCurrentAvatar(user.avatar ?? null);
    hasHydrated.current = true;
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[e.target.name];
        return next;
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setCurrentAvatar(null);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const hasChanges =
    !!user &&
    (form.name !== (user.name ?? "") ||
      form.phone_number !== (user.phone_number ?? "") ||
      form.address !== (user.address ?? "") ||
      avatarFile !== null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Never send email to the server — it's read-only and would 400.
    const { email: _omit, ...editable } = form;

    const payload: any = avatarFile ? new FormData() : { ...editable };
    if (avatarFile) {
      Object.entries(editable).forEach(([k, v]) => payload.append(k, v as string));
      payload.append("avatar", avatarFile);
    }

    try {
      const response = await updateProfile.mutateAsync(payload);
      if (avatarFile) {
        setCurrentAvatar(avatarPreview);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
      if (response.success) {
        showToast(
          "Success",
          "Profile updated successfully.",
          "success"
        );
      } else {
        setErrors(response.errors || response);
      }
    } catch (err: any) {
      showToast("Error", "Failed to update user details.", "error");
      setErrors(err?.response?.data || err?.response || {});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <LoadingSpinner
          size="lg"
          color="indigo-600"
          label="Fetching user details..."
          showTimer
        />
      </div>
    );
  }

  const avatarSrc = avatarPreview ?? currentAvatar;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-3 duration-300 pb-12"
    >
      {/* Header & Avatar Card */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-violet-500/15" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 pt-4 sm:pt-6">
          {/* Avatar Upload Container */}
          <div className="relative group shrink-0">
            <div className="relative h-28 w-28 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt="User Avatar"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <User className="text-slate-400" size={44} />
              )}

              {/* Hover Overlay */}
              <label className="absolute inset-0 bg-slate-900/65 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                <Camera className="text-white mb-1 animate-in zoom-in-50 duration-150" size={22} />
                <span className="text-[11px] font-semibold text-white tracking-wide">
                  Change Photo
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg shadow-md ring-2 ring-white pointer-events-none transition-transform group-hover:scale-110">
              <Camera size={13} />
            </div>
          </div>

          {/* User Metadata */}
          <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight truncate">
                {form.name || "User Profile"}
              </h2>
              <ShieldCheck size={14} className="text-indigo-600" />
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-3 text-sm text-slate-500">
              {form.email && (
                <span className="truncate max-w-[240px] sm:max-w-xs" title={form.email}>
                  {form.email}
                </span>
              )}
              
              {form.email && form.phone_number && (
                <span className="hidden sm:inline-block text-slate-300 font-bold">•</span>
              )}

              {form.phone_number && (
                <span className="font-mono text-slate-600 text-xs font-medium">
                  {form.phone_number}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {errors.non_field_errors && (
        <div className="p-4 bg-red-50/80 border border-red-200/80 rounded-xl flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            {Array.isArray(errors.non_field_errors)
              ? errors.non_field_errors.join(", ")
              : String(errors.non_field_errors)}
          </div>
        </div>
      )}

      {/* Profile Form Details Grid Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Personal Information
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your name, phone number, address, and photo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`${inputBase} ${errors.name ? "border-red-500 bg-red-50/20" : "border-slate-200"}`}
                placeholder="John Doe"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Personal Email — locked */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Personal Email
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Lock size={10} />
                Locked
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                <Mail size={18} />
              </div>

              <input
                type="email"
                name="email"
                value={form.email}
                readOnly
                disabled
                tabIndex={-1}
                aria-readonly="true"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed select-none outline-none"
              />

              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-300">
                <Lock size={14} />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              To change your email address, please contact support.
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className={`${inputBase} ${errors.phone_number ? "border-red-500 bg-red-50/20" : "border-slate-200"}`}
                placeholder="+254 700 000000"
              />
            </div>
            {errors.phone_number && (
              <p className="text-xs text-red-500 font-medium">
                {errors.phone_number}
              </p>
            )}
          </div>

          {/* Physical Address */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Physical Address
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <MapPin size={18} />
              </div>
              <textarea
                name="address"
                rows={3}
                value={form.address}
                onChange={handleChange}
                className={`${inputBase} resize-none ${errors.address ? "border-red-500 bg-red-50/20" : "border-slate-200"}`}
                placeholder="Street name, apartment, unit, city or region..."
              />
            </div>
            {errors.address && (
              <p className="text-xs text-red-500 font-medium">
                {errors.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Dock */}
      <div className="sticky bottom-4 z-20 bg-white/85 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-slate-900/5">
        <div className="flex items-center gap-3">
          {hasChanges ? (
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-600">
                  Unsaved changes
                </p>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Save your updates before leaving this page
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-sm font-medium text-slate-600">
                Everything is up to date
              </p>
            </div>
          )}
        </div>

        <div className="relative group w-full sm:w-auto">
          <button
            type="submit"
            disabled={updateProfile.isPending || !hasChanges}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
          {!hasChanges && (
            <CustomTooltip message="No pending edits to save" />
          )}
        </div>
      </div>
    </form>
  );
};

export default UserSettings;