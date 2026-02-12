'use client';

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/app/services/apiService";
import CustomButton from "@/app/components/ui/CustomButton";
import { CircleAlert, Eye, EyeOff, User, Mail, Phone, MapPin, Lock, Upload, X } from "lucide-react";

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

            console.log("SENDING DATA: ", formData);

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
    const inputStyle = "w-full px-10 py-3 bg-gray-900 border-2 border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-gray-800 transition-all duration-300 ease-out hover:border-gray-600 hover:bg-gray-850";
    const iconStyle = "absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 peer-focus:text-blue-500 transition-colors duration-300";
    
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6 flex items-center justify-center">
            <div className="w-full max-w-[650px] mt-20 bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700/50 p-6 md:p-8">
                {/* Header - More Compact */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center mb-4">
                        <Image
                            src="/rentwise_logo.jpeg"
                            alt="Logo"
                            width={80}
                            height={80}
                            className="rounded-xl"
                            unoptimized
                        />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
                        Join RentWise
                    </h1>
                    <p className="text-gray-400 mt-1 text-xs md:text-sm">
                        Create your account to get started
                    </p>
                </div>

                <form className="space-y-4">
                    {/* Two-column layout for name and email on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name Field */}
                        <div className="space-y-1.5">
                            <div className={inputContainerStyle}>
                                <User className={`${iconStyle} w-4 h-4`} />
                                <input 
                                    onChange={(e) => setName(e.target.value)}
                                    type="text" 
                                    name="name" 
                                    id="name"
                                    placeholder="Full Name"
                                    className={`${inputStyle} peer ${errors.name ? '!border-red-500' : ''}`}
                                />
                            </div>
                            {errors.name && (
                                <p className="text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                                    <CircleAlert className="w-4 h-4" />
                                    <span className=""></span>{errors.name[0]}
                                </p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <div className={inputContainerStyle}>
                                <Mail className={`${iconStyle} w-4 h-4`} />
                                <input 
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email" 
                                    name="email" 
                                    id="email"
                                    placeholder="Email"
                                    className={`${inputStyle} peer ${errors.email ? '!border-red-500' : ''}`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                                    <CircleAlert className="w-4 h-4" />
                                    <span className="mt-0.5"></span>{errors.email[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Two-column layout for phone and address */}
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-700 p-4 rounded-xl">
                        <legend className="text-gray-400 text-xs md:text-sm">Optional</legend>

                        {/* Phone Number Field */}
                        <div className="space-y-1.5">
                            <div className={inputContainerStyle}>
                                <Phone className={`${iconStyle} w-4 h-4`} />
                                <input 
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    type="tel" 
                                    name="phone-number" 
                                    id="phone-number"
                                    placeholder="Phone"
                                    className={`${inputStyle} peer ${errors.phone_number ? '!border-red-500' : ''}`}
                                />
                            </div>
                            {errors.phone_number && (
                                <p className="text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                                    <CircleAlert className="w-4 h-4" />
                                    <span className="mt-0.5"></span>{errors.phone_number[0]}
                                </p>
                            )}
                        </div>

                        {/* Address Field */}
                        <div className="space-y-1.5">
                            <div className={inputContainerStyle}>
                                <MapPin className={`${iconStyle} w-4 h-4`} />
                                <input 
                                    onChange={(e) => setAddress(e.target.value)}
                                    type="text" 
                                    name="address" 
                                    id="address"
                                    placeholder="Address"
                                    className={`${inputStyle} peer ${errors.address ? '!border-red-500' : ''}`}
                                />
                            </div>
                            {errors.address && (
                                <p className="text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                                    <CircleAlert className="w-4 h-4" />
                                    <span className="mt-0.5"></span>{errors.address[0]}
                                </p>
                            )}
                        </div>
                    </fieldset>

                    {/* Password Fields */}
                    <div className="space-y-3">
                        {/* Password Field 1 */}
                        <div className="space-y-1.5">
                            <div className={inputContainerStyle}>
                                <Lock className={`${iconStyle} w-4 h-4`} />
                                <input 
                                    onChange={(e) => setPassword1(e.target.value)}
                                    type={showPassword1 ? "text" : "password"}
                                    name="password" 
                                    id="password1"
                                    placeholder="Create Password"
                                    minLength={8}
                                    className={`${inputStyle} peer ${errors.password1 ? '!border-red-500' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword1(!showPassword1)}
                                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password1 && (
                                <p className="text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                                    <CircleAlert className="w-4 h-4" />
                                    <span className="mt-0.5"></span>{errors.password1[0]}
                                </p>
                            )}
                        </div>

                        {/* Password Field 2 */}
                        <div className="space-y-1.5">
                            <div className={inputContainerStyle}>
                                <Lock className={`${iconStyle} w-4 h-4`} />
                                <input 
                                    onChange={(e) => setPassword2(e.target.value)}
                                    type={showPassword2 ? "text" : "password"}
                                    name="password" 
                                    id="password2"
                                    placeholder="Confirm Password"
                                    className={`${inputStyle} peer ${errors.password2 ? '!border-red-500' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword2(!showPassword2)}
                                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password2 && (
                                <p className="text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                                    <CircleAlert className="w-4 h-4" />
                                    <span className="mt-0.5"></span>{errors.password2[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Avatar Upload - More Compact */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="avatar" className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                Avatar (Optional)
                            </label>
                            <span className="text-xs text-gray-500 bg-gray-900/50 px-2 py-1 rounded-lg">Max 2MB</span>
                        </div>
                        
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <input 
                                        type="file"
                                        name="avatar"
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
                                        className={`w-full px-3 py-2 bg-gray-900 border-2 border-gray-700 rounded-xl text-gray-100 text-sm
                                            file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                                            file:text-xs file:font-medium file:bg-blue-600/20 file:text-blue-400
                                            hover:file:bg-blue-600/30 cursor-pointer
                                            ${errors.avatar ? '!border-red-500' : ''}`}
                                    />
                                </div>
                                
                                {avatarPreview && (
                                    <div className="relative">
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar Preview"
                                            className="w-10 h-10 object-cover rounded-lg border-2 border-gray-600 shadow-sm"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setAvatarFile(null);
                                                setAvatarPreview(null);
                                                if (avatarInputRef.current) avatarInputRef.current.value = "";
                                            }}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700 hover:scale-110 transition-all shadow-md"
                                            title="Remove avatar"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {errors.avatar && (
                                <p className="text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                                    <CircleAlert className="w-4 h-4" />
                                    <span className="mt-0.5"></span>{errors.avatar[0]}
                                </p>
                            )}
                            
                            {avatarPreview && !errors.avatar && (
                                <p className="text-xs text-gray-400 truncate">
                                    Selected: {avatarFile?.name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {errors.non_field_errors && (
                        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-3 backdrop-blur-sm animate-fadeIn">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                <p className="text-sm font-medium">{errors.non_field_errors[0]}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-1">
                        <CustomButton 
                            label={loading ? "Creating Account..." : "Create Account"}
                            onClick={submitSignup}
                            loading={loading}
                            className={`w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold 
                                rounded-xl hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] 
                                transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/20
                                disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm md:text-base`}
                        />
                    </div>

                    {/* Footer Link */}
                    <div className="pt-4 border-t border-gray-700/50">
                        <p className="text-center text-xs md:text-sm text-gray-400">
                            Already have an account?{" "}
                            <a 
                                href="/auth/login" 
                                className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors"
                            >
                                Sign In
                            </a>
                        </p>
                    </div>
                </form>

                {/* Decorative Elements */}
                <div className="absolute -z-10 top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -z-10 bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>
        </main>
    )
}

export default SignUp;