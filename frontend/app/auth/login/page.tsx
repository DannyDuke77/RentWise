'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleLogin } from "@/app/src/lib/actions";
import apiService from "@/app/services/apiService";
import { jwtDecode } from "jwt-decode";
import { Mail, Lock, AlertCircle, Building2, UserRound, Shield } from "lucide-react";
import Link from "next/link";

const DEBUG = process.env.NODE_ENV !== 'production';

const Login = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const getPortalType = () => {
        if (typeof window === 'undefined') return 'public';
        const hostname = window.location.hostname;
        if (hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST) return 'landlord';
        if (hostname === process.env.NEXT_PUBLIC_TENANT_PORTAL_HOST) return 'tenant';
        if (hostname === process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST) return 'admin';
        return 'public';
    };

    const portalType = getPortalType();

    const portalConfig = {
        landlord: {
            name: 'Landlord Portal',
            icon: Building2,
            color: 'blue',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
            text: 'text-blue-600',
        },
        tenant: {
            name: 'Tenant Portal',
            icon: UserRound,
            color: 'emerald',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
            text: 'text-emerald-600',
        },
        admin: {
            name: 'Admin Portal',
            icon: Shield,
            color: 'purple',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
            text: 'text-purple-600',
        },
        public: {
            name: 'Sign In',
            icon: Mail,
            color: 'blue',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
            text: 'text-blue-600',
        }
    };

    const config = portalConfig[portalType] || portalConfig.public;
    const PortalIcon = config.icon;

    useEffect(() => {
        setMounted(true);
    }, []);

    const submitLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors([]);

        const formData = { email, password, portal_type: portalType };

        try {
            const response = await apiService.post('/api/auth/login/', formData);

            if (DEBUG) console.log(response);

            if (!response?.access || !response?.refresh) {
                const messages =
                    response?.non_field_errors ||
                    response?.detail ||
                    response?.error ||
                    ['Invalid login response'];

                setErrors(Array.isArray(messages) ? messages : [messages]);
                return;
            }

            const decoded: any = jwtDecode(response.access);
            const userId = decoded.user_id ?? decoded.sub;

            await handleLogin(userId, response.access, response.refresh);

            const next = searchParams.get('next');

            if (next) {
                router.push(next);
                return;
            }

            if (portalType === 'tenant') {
                window.location.href =
                    `${process.env.NEXT_PUBLIC_TENANT_PORTAL_URL}/tenant-portal`;
                return;
            }

            if (portalType === 'admin') {
                window.location.href =
                    `${process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL}/admin`;
                return;
            }

            // Default: landlord
            window.location.href =
                `${process.env.NEXT_PUBLIC_LANDLORD_PORTAL_URL}/landlord-portal`;
        } catch (error: any) {
            console.error('Login error:', error);

            const data = error?.response?.data;
            const messages =
                data?.non_field_errors ||
                data?.detail ||
                data?.error ||
                ['Network error or server unavailable'];

            setErrors(Array.isArray(messages) ? messages : [messages]);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

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
                    
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <PortalIcon className={`w-5 h-5 ${config.text}`} />
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {config.name}
                        </h1>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                        Enter your credentials to continue
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <form onSubmit={submitLogin} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    disabled={loading}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link
                                    href="/auth/reset-password"
                                    className="text-xs text-gray-500 hover:text-gray-700 hover:underline transition"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Errors */}
                        {errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-0.5">
                                            Error
                                        </p>
                                        <ul className="text-sm text-red-700 space-y-0.5">
                                            {errors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-2.5 ${config.button} text-white text-sm font-medium rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                        {/* Register Link */}
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-center text-sm text-gray-500">
                                Need an account?{' '}
                                <Link
                                    href="/auth/register"
                                    className={`${config.text} font-medium hover:underline transition`}
                                >
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default Login;