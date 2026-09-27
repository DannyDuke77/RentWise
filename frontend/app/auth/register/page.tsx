'use client';

import Image from "next/image";
import { useState, useRef } from "react";
import apiService from "@/app/services/apiService";
import {
    CircleAlert, Eye, EyeOff, User, Mail, Phone, MapPin, Lock,
    Upload, X, ArrowRight, CircleCheckBig, Building2, Info,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/app/providers/ToastProvider";
import BackButton from "@/app/components/navigation/BackButton";

const landlordPortalUrl = process.env.NEXT_PUBLIC_LANDLORD_PORTAL_URL || '';

const formatApiErrors = (data: any): Record<string, string[]> => {
    const formatted: Record<string, string[]> = {};

    if (!data) return formatted;

    if (typeof data === 'string') {
        return { non_field_errors: [data] };
    }

    if (data.non_field_errors) {
        formatted.non_field_errors = Array.isArray(data.non_field_errors)
            ? data.non_field_errors
            : [data.non_field_errors];
    } else if (data.detail) {
        formatted.non_field_errors = [data.detail];
    } else if (data.error) {
        formatted.non_field_errors = [data.error];
    }

    Object.keys(data).forEach((key) => {
        if (key === 'detail' || key === 'error') return;
        if (key === 'non_field_errors' && formatted.non_field_errors) return;

        const value = data[key];
        formatted[key] = Array.isArray(value) ? value : [value];
    });

    return formatted;
};

const SignUp = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const { showToast } = useToast();

    const submitSignup = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        if (!name || !email || !password1 || !password2) {
            showToast("Missing Information!", "Please fill in all required fields", "error");
            setErrors({
                ...(name.trim() === "" && { name: ["Full name is required"] }),
                ...(email.trim() === "" && { email: ["Email address is required"] }),
                ...(password1 === "" && { password1: ["Password is required"] }),
                ...(password2 === "" && { password2: ["Confirm password is required"] }),
            });
            setLoading(false);
            return;
        }

        if (password1 !== password2) {
            showToast("Passwords Don't Match!", "Please make sure both passwords match", "error");
            setErrors({
                password2: ["Passwords do not match"],
            });
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone_number', phoneNumber);
            formData.append('address', address);
            formData.append('password1', password1);
            formData.append('password2', password2);

            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await apiService.post('/api/auth/register/',formData);

            if (!response?.access) {
                setErrors({
                    non_field_errors: ['Invalid registration response'],
                });
                return;
            }

            setSuccess(true);

            showToast('Account Created!', 'Your account has been created successfully.', 'success');

        } catch (error: any) {
            const data = error?.response?.data;

            if (data && typeof data === 'object') {
                setErrors(formatApiErrors(data));
            } else {
                setErrors({
                    non_field_errors: [
                        'Network error or server unavailable'
                    ],
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const inputBase =
        "w-full pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 rounded-lg border bg-white outline-none transition-colors";

    const inputClass = (field?: string) =>
        `${inputBase} ${
            field && errors[field]
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-100'
        }`;

    const iconClass =
        "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none";

    const Field = ({
        id, label, icon, required, error, children,
    }: {
        id?: string;
        label: string;
        icon: React.ReactNode;
        required?: boolean;
        error?: string[];
        children?: React.ReactNode;
    }) => (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-xs font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                {icon}
                {children}
            </div>
            {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                    <CircleAlert className="w-3 h-3 flex-shrink-0" />
                    {error[0]}
                </p>
            )}
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 md:py-12 flex items-center justify-center">
            <div className="w-full max-w-[560px]">

                {success ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                            <CircleCheckBig className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                        </div>
                        <h1 className="text-lg font-semibold text-gray-900 mt-5">
                            Account created successfully
                        </h1>
                        <p className="text-sm text-gray-500 mt-1.5">
                            You can now sign in to the landlord portal with your email and password.
                        </p>
                        <Link
                            href={`${landlordPortalUrl}/auth/login/`}
                            rel="noopener noreferrer"
                            className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <span>Go to landlord portal</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
                        <button className="absolute">
                            <Link
                                href={`/`}
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-gray-700 hover:underline"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back</span>
                            </Link>
                        </button>

                        {/* Header */}
                        <div className="text-center mb-7">
                            <div className="inline-flex items-center justify-center mb-4">
                                <Image
                                    src="/rentwise_logo.jpeg"
                                    alt="RentWise"
                                    width={96}
                                    height={76}
                                    className="rounded-lg"
                                    unoptimized
                                />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                Create a landlord account
                            </h1>
                            <p className="text-sm text-gray-500 mt-1.5">
                                Manage properties, tenants, and rent from one place.
                            </p>
                        </div>

                        {/* Tenant notice */}
                        <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50 p-3.5 mb-6">
                            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-800 leading-relaxed">
                                <span className="font-semibold">Not a landlord?</span>{" "}
                                Tenant accounts are created by invite only. If you're renting,
                                ask your landlord to add you — you'll receive an email with a
                                link to set up your account.
                            </div>
                        </div>

                        <form className="space-y-5">
                            {/* Name + Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field
                                    id="name"
                                    label="Full name"
                                    required
                                    icon={<User className={iconClass} />}
                                    error={errors.name}
                                >
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className={inputClass('name')}
                                    />
                                </Field>

                                <Field
                                    id="email"
                                    label="Email"
                                    required
                                    icon={<Mail className={iconClass} />}
                                    error={errors.email}
                                >
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className={inputClass('email')}
                                    />
                                </Field>
                            </div>

                            {/* Optional block */}
                            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-4">
                                <legend className="text-xs font-medium text-gray-500 px-1.5">
                                    Optional
                                </legend>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field
                                        id="phone-number"
                                        label="Phone number"
                                        icon={<Phone className={iconClass} />}
                                        error={errors.phone_number}
                                    >
                                        <input
                                            id="phone-number"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="+254 700 000 000"
                                            className={inputClass('phone_number')}
                                        />
                                    </Field>

                                    <Field
                                        id="address"
                                        label="Address"
                                        icon={<MapPin className={iconClass} />}
                                        error={errors.address}
                                    >
                                        <input
                                            id="address"
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Nairobi, Kenya"
                                            className={inputClass('address')}
                                        />
                                    </Field>
                                </div>
                            </fieldset>

                            {/* Passwords */}
                            <div className="space-y-4">
                                <Field
                                    id="password1"
                                    label="Password"
                                    required
                                    icon={<Lock className={iconClass} />}
                                    error={errors.password1}
                                >
                                    <input
                                        id="password1"
                                        type={showPassword1 ? "text" : "password"}
                                        value={password1}
                                        onChange={(e) => setPassword1(e.target.value)}
                                        placeholder="At least 8 characters"
                                        minLength={8}
                                        className={`${inputClass('password1')} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword1(!showPassword1)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </Field>

                                <Field
                                    id="password2"
                                    label="Confirm password"
                                    required
                                    icon={<Lock className={iconClass} />}
                                    error={errors.password2}
                                >
                                    <input
                                        id="password2"
                                        type={showPassword2 ? "text" : "password"}
                                        value={password2}
                                        onChange={(e) => setPassword2(e.target.value)}
                                        placeholder="Re-enter your password"
                                        className={`${inputClass('password2')} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword2(!showPassword2)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </Field>
                            </div>

                            {/* Avatar */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-gray-700">
                                    Avatar <span className="text-gray-400 font-normal">(optional, max 2MB)</span>
                                </label>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        id="avatar"
                                        accept="image/*"
                                        ref={avatarInputRef}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] ?? null;
                                            setAvatarFile(file);
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = () => setAvatarPreview(reader.result as string);
                                                reader.readAsDataURL(file);
                                            } else {
                                                setAvatarPreview(null);
                                            }
                                        }}
                                        className={`flex-1 text-xs text-gray-500
                                            file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0
                                            file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700
                                            hover:file:bg-gray-200 cursor-pointer
                                            ${errors.avatar ? 'border border-red-300 rounded-lg p-1' : ''}`}
                                    />

                                    {avatarPreview && (
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={avatarPreview}
                                                alt="Avatar preview"
                                                className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setAvatarFile(null);
                                                    setAvatarPreview(null);
                                                    if (avatarInputRef.current) avatarInputRef.current.value = "";
                                                }}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
                                                title="Remove avatar"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {errors.avatar && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <CircleAlert className="w-3 h-3 flex-shrink-0" />
                                        {errors.avatar[0]}
                                    </p>
                                )}
                            </div>

                            {/* Non-field errors */}
                            {errors.non_field_errors && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 p-3.5">
                                    <CircleAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-800">{errors.non_field_errors[0]}</p>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                onClick={submitSignup}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <Building2 className="w-4 h-4" />
                                        <span>Create landlord account</span>
                                    </>
                                )}
                            </button>

                            {/* Sign in */}
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-center text-sm text-gray-500">
                                    Already have an account?{" "}
                                    <Link
                                        href={`${landlordPortalUrl}/auth/login`}
                                        className="text-gray-900 hover:text-gray-700 font-medium hover:underline transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </main>
    );
};

export default SignUp;