'use client';

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/app/services/apiService";
import CustomButton from "@/app/components/ui/CustomButton";
import { CircleAlert, Eye, EyeOff, User, Mail, Phone, MapPin, Lock, Upload, X } from "lucide-react";
import Link from "next/link";

const SignUp = () => {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const submitSignup = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try{
            const formData = new FormData();

            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone_number', phoneNumber);
            formData.append('address', address);
            formData.append('password1', password1);
            formData.append('password2', password2);

            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            const response = await apiService.post('/api/auth/register/', formData);

            if (response.access) {
                router.push('/auth/login');
            } else {
                const formattedErrors: Record<string, string[]> = {};
            
                if (response.non_field_errors) {
                    formattedErrors.non_field_errors = Array.isArray(response.non_field_errors) 
                        ? response.non_field_errors 
                        : [response.non_field_errors];
                } else if (response.detail) {
                    formattedErrors.non_field_errors = [response.detail];
                } else if (response.error) {
                    formattedErrors.non_field_errors = [response.error];
                }
                
                Object.keys(response).forEach(key => {
                    if (key !== 'detail' && key !== 'error') {
                        formattedErrors[key] = Array.isArray(response[key]) 
                            ? response[key] 
                            : [response[key]];
                    }
                });
                
                setErrors(formattedErrors);
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            setErrors({ 
                non_field_errors: ['Network error or server unavailable'] 
            });
        } finally {
            setLoading(false);
        }
    };

    const inputContainerStyle = "relative";
    const inputStyle = "w-full px-10 py-2.5 bg-white border border-gray-300 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm";
    const iconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 peer-focus:text-blue-500 transition-colors duration-200 w-4 h-4";
    
    return (
        <main className="min-h-screen bg-gray-50 px-4 py-6 md:py-10 flex items-center justify-center">
            <div className="w-full max-w-[600px] bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
                
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
                        Create your account
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Start managing rentals with RentWise
                    </p>
                </div>

                <form className="space-y-4">
                    {/* Two-column layout for name and email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name Field */}
                        <div className="space-y-1">
                            <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className={inputContainerStyle}>
                                <User className={iconStyle} />
                                <input 
                                    onChange={(e) => setName(e.target.value)}
                                    type="text" 
                                    id="name"
                                    placeholder="John Doe"
                                    className={`${inputStyle} peer ${errors.name ? '!border-red-500 !ring-1 !ring-red-500' : ''}`}
                                />
                            </div>
                            {errors.name && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <CircleAlert className="w-3.5 h-3.5" />
                                    {errors.name[0]}
                                </p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className={inputContainerStyle}>
                                <Mail className={iconStyle} />
                                <input 
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email" 
                                    id="email"
                                    placeholder="you@example.com"
                                    className={`${inputStyle} peer ${errors.email ? '!border-red-500 !ring-1 !ring-red-500' : ''}`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <CircleAlert className="w-3.5 h-3.5" />
                                    {errors.email[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Phone and Address - optional */}
                    <fieldset className="border border-gray-200 rounded-md p-4 space-y-4">
                        <legend className="text-xs text-gray-400 px-1">Optional</legend>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Phone */}
                            <div className="space-y-1">
                                <label htmlFor="phone-number" className="text-sm font-medium text-gray-700">
                                    Phone number
                                </label>
                                <div className={inputContainerStyle}>
                                    <Phone className={iconStyle} />
                                    <input 
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        type="tel" 
                                        id="phone-number"
                                        placeholder="+254 700 000 000"
                                        className={`${inputStyle} peer ${errors.phone_number ? '!border-red-500 !ring-1 !ring-red-500' : ''}`}
                                    />
                                </div>
                                {errors.phone_number && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <CircleAlert className="w-3.5 h-3.5" />
                                        {errors.phone_number[0]}
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="space-y-1">
                                <label htmlFor="address" className="text-sm font-medium text-gray-700">
                                    Address
                                </label>
                                <div className={inputContainerStyle}>
                                    <MapPin className={iconStyle} />
                                    <input 
                                        onChange={(e) => setAddress(e.target.value)}
                                        type="text" 
                                        id="address"
                                        placeholder="Nairobi, Kenya"
                                        className={`${inputStyle} peer ${errors.address ? '!border-red-500 !ring-1 !ring-red-500' : ''}`}
                                    />
                                </div>
                                {errors.address && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <CircleAlert className="w-3.5 h-3.5" />
                                        {errors.address[0]}
                                    </p>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    {/* Passwords */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label htmlFor="password1" className="text-sm font-medium text-gray-700">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className={inputContainerStyle}>
                                <Lock className={iconStyle} />
                                <input 
                                    onChange={(e) => setPassword1(e.target.value)}
                                    type={showPassword1 ? "text" : "password"}
                                    id="password1"
                                    placeholder="Min. 8 characters"
                                    minLength={8}
                                    className={`${inputStyle} peer ${errors.password1 ? '!border-red-500 !ring-1 !ring-red-500' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword1(!showPassword1)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password1 && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <CircleAlert className="w-3.5 h-3.5" />
                                    {errors.password1[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password2" className="text-sm font-medium text-gray-700">
                                Confirm password <span className="text-red-500">*</span>
                            </label>
                            <div className={inputContainerStyle}>
                                <Lock className={iconStyle} />
                                <input 
                                    onChange={(e) => setPassword2(e.target.value)}
                                    type={showPassword2 ? "text" : "password"}
                                    id="password2"
                                    placeholder="Confirm your password"
                                    className={`${inputStyle} peer ${errors.password2 ? '!border-red-500 !ring-1 !ring-red-500' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword2(!showPassword2)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password2 && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <CircleAlert className="w-3.5 h-3.5" />
                                    {errors.password2[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Avatar Upload */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            Avatar (optional)
                            <span className="text-gray-400 font-normal text-xs ml-1">Max 2MB</span>
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
                                className={`flex-1 text-sm text-gray-500
                                    file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0
                                    file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700
                                    hover:file:bg-gray-200 cursor-pointer
                                    ${errors.avatar ? '!border-red-500' : ''}`}
                            />
                            
                            {avatarPreview && (
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar preview"
                                        className="w-10 h-10 object-cover rounded-md border border-gray-200"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setAvatarFile(null);
                                            setAvatarPreview(null);
                                            if (avatarInputRef.current) avatarInputRef.current.value = "";
                                        }}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-xs transition-colors"
                                        title="Remove avatar"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {errors.avatar && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                                <CircleAlert className="w-3.5 h-3.5" />
                                {errors.avatar[0]}
                            </p>
                        )}
                        
                        {avatarPreview && !errors.avatar && (
                            <p className="text-xs text-gray-400 truncate">
                                {avatarFile?.name}
                            </p>
                        )}
                    </div>

                    {/* Error Display */}
                    {errors.non_field_errors && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                            <p>{errors.non_field_errors[0]}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        onClick={submitSignup}
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>

                    {/* Login link */}
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link 
                                href="/auth/login" 
                                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </main>
    )
}

export default SignUp;