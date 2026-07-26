'use client';

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleLogin } from "@/app/lib/actions";
import apiService from "@/app/services/apiService";
import { jwtDecode } from "jwt-decode";
import { Mail, Lock, AlertCircle } from "lucide-react";

const DEBUG = process.env.NODE_ENV !== 'production';

const Login = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const submitLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors([]);

        const formData = {
            email: email,
            password: password
        }

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

            const nextUrl = searchParams.get('next') || '/dashboard';

            const decoded: any = jwtDecode(response.access);
            const userId = decoded.user_id ?? decoded.sub;

            await handleLogin(userId, response.access, response.refresh);

            router.push(nextUrl);

        } catch (error: any) {
            console.error('Login error:', error);
            setErrors(['Network error or server unavailable']);
        } finally {
            setLoading(false);
        }
    }

    const inputContainerStyle = "relative";
    const inputStyle = "w-full px-10 py-2.5 bg-white border border-gray-300 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm";
    const iconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 peer-focus:text-blue-500 transition-colors duration-200 w-4 h-4";

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-6 md:py-10 flex items-center justify-center">
            <div className="w-full max-w-[500px] bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
                
                {/* Header */}
                <div className="text-center mb-7">
                    <div className="inline-flex items-center justify-center mb-4">
                        <Image
                            src="/rentwise_logo.jpeg"
                            alt="RentWise"
                            width={100}
                            height={80}
                            className="rounded-md"
                            unoptimized
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Sign in to your account
                    </p>
                </div>

                <form onSubmit={submitLogin} className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-1">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <div className={inputContainerStyle}>
                            <Mail className={iconStyle} />
                            <input 
                                onChange={(e) => setEmail(e.target.value)}
                                type="email" 
                                id="email"
                                placeholder="you@example.com"
                                value={email}
                                required
                                className={`${inputStyle} peer`}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <a 
                                href="/auth/reset-password" 
                                className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            >
                                Forgot password?
                            </a>
                        </div>
                        <div className={inputContainerStyle}>
                            <Lock className={iconStyle} />
                            <input 
                                onChange={(e) => setPassword(e.target.value)}
                                type="password" 
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                required
                                className={`${inputStyle} peer`}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                            <div className="flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-xs uppercase tracking-wider text-red-600 mb-1">
                                        Unable to sign in
                                    </p>
                                    <ul className="space-y-0.5">
                                        {errors.map((error, index) => (
                                            <li key={`error_${index}`} className="text-sm">
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>

                    {/* Footer Link */}
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-500">
                            Don't have an account?{" "}
                            <a 
                                href="/auth/register" 
                                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                            >
                                Create account
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default Login;