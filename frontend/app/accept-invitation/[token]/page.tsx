"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiService from "@/app/services/apiService";
import Image from "next/image";
import { Mail, Lock, AlertCircle, UserRound, CheckCircle, CircleCheckBig, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

interface TenantInvitationData {
    valid: boolean;
    email: string;
    full_name: string;
}

interface BusinessInvitationData {
    valid: boolean;
    email: string;
    role: string;
    business: {
        id: string;
        company_name: string;
    };
}

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || '/';

export default function AcceptInvitationPage() {
    const params = useParams();
    const token = params.token as string;

    const isLandlordPortal =
        typeof window !== "undefined" &&
        window.location.hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST;

    const [invitation, setInvitation] = useState<TenantInvitationData | BusinessInvitationData | null>(null);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const validateInvitation = async () => {
            try {
                const isLandlordPortal = window.location.hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST;
                
                const endpoint = isLandlordPortal ? `/api/business-invitations/${token}` : `/api/tenants/invitation/${token}`;

                const data = await apiService.get(endpoint);
                setInvitation(data);
            } catch (err) {
                console.error("Failed to validate invitation:", err);
                setError("This invitation is invalid or has expired.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            validateInvitation();
        }
    }, [token]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (password !== passwordConfirm) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const isLandlordPortal = window.location.hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST;

            const endpoint = isLandlordPortal ? `/api/business-invitations/${token}/` : `/api/tenants/invitation/${token}/accept/`;
            const data = await apiService.post(endpoint, {
                password,
                password_confirm: passwordConfirm,
            });
            
            if (!data.success) {
                const message =
                    data.detail ||
                    data.password?.[0] ||
                    data.password_confirm?.[0] ||
                    data.token?.[0] ||
                    "Unable to create your account.";

                throw new Error(message);
                
            }

            setSuccess(true);
        } catch (err: any) {
            console.error("Failed to accept invitation:", err);
            setError(err.message || "Unable to create your account.");
        } finally {
            setSubmitting(false);
        }
    };

    // Loading State
    if (loading) {
        return (
            <LoadingSpinner
                label="Loading..."
                size="lg"
                showTimer={true}
                fullPage={true}
            />
        );
    }

    // Error State (Invalid/Expired Invitation)
    if (error && !invitation) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl border border-gray-100">
                        <div className="text-center">
                            <div className="relative flex justify-center mb-6">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 bg-red-100 rounded-full animate-ping" />
                                </div>
                                <div className="relative w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                            </div>
                            
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-2">
                                Invitation Unavailable
                            </h1>
                            
                            <div className="w-16 h-1 bg-gradient-to-r from-red-400 to-red-600 mx-auto rounded-full mb-4" />
                            
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-red-700 font-medium">
                                    {error}
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <Link
                                    href={NEXT_PUBLIC_URL}
                                    className="block w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                                >
                                    Return to Home
                                </Link>
                                
                                <button
                                    onClick={() => window.location.reload()}
                                    className="block w-full px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-300"
                                >
                                    Try Again
                                </button>
                            </div>
                            
                            {/* Help text */}
                            <p className="mt-4 text-xs text-gray-400">
                                If this issue persists, please contact support
                            </p>
                        </div>
                    </div>
                    
                    {/* Decorative bottom element */}
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                            <span className="w-8 h-px bg-gray-300" />
                            <span>Need help?</span>
                            <span className="w-8 h-px bg-gray-300" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (success) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md border border-gray-200 rounded-lg shadow-lg p-6">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="relative inline-block">
                                <CircleCheckBig className="w-14 h-14 text-emerald-600 mx-auto" strokeWidth={1.5} />
                                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Welcome to RentWise!
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Your account has been created successfully.
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            {isLandlordPortal
                                ? "You can now log in to your RentWise account."
                                : "You can now log in to your tenant portal."}
                        </p>
                        <Link
                            href="/auth/login"
                            className="px-6 py-2.5 mt-6 inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md border border-gray-200 rounded-lg shadow-lg p-6">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/rentwise_logo.jpeg"
                            alt="RentWise"
                            width={64}
                            height={64}
                            className="rounded-lg"
                            unoptimized
                        />
                    </div>

                    <div className="flex items-center justify-center gap-2">
                        <UserRound className="w-5 h-5 text-emerald-600" />
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Create Your Account
                        </h1>
                    </div>

                    {isLandlordPortal ? (
                        <>
                            <p className="text-sm text-gray-500 mt-1">
                                You've been invited to join{" "}
                                <span className="font-medium text-gray-700">
                                    {(invitation as BusinessInvitationData)?.business.company_name}
                                </span>
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                                Role:{" "}
                                <span className="font-medium text-gray-700 capitalize">
                                    {(invitation as BusinessInvitationData)?.role}
                                </span>
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Welcome, {(invitation as TenantInvitationData)?.full_name}
                        </p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 mb-4 border border-red-200 rounded-md p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-0.5">
                                    Error
                                </p>
                                <p className="text-sm text-red-700">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email (Disabled) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="email"
                                    value={invitation?.email || ""}
                                    disabled
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    disabled={submitting}
                                    placeholder="Create a password"
                                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={passwordConfirm}
                                    onChange={(event) => setPasswordConfirm(event.target.value)}
                                    required
                                    disabled={submitting}
                                    placeholder="Confirm your password"
                                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                            {submitting ? "Creating account..." : "Create Account"}
                        </button>

                        {/* Login Link */}
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-center text-sm text-gray-500">
                                Already have an account?{' '}
                                <a
                                    href="/auth/login"
                                    className="text-emerald-600 font-medium hover:underline transition"
                                >
                                    Sign in
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}