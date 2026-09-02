'use client';

import React, { useState } from "react";
import { 
    User, Mail, Phone, FileText, UserPlus, UserCheck, 
    Wrench, AlertTriangle, Clock, CircleCheckBig, 
    Building2, Calendar, Shield, ChevronRight
} from "lucide-react";
import apiService from "@/app/services/apiService";
import { useAddTenant } from "@/app/hooks/mutations/useUnitMutations";

interface TenantAssignmentFormProps {
    unit: {
        id: string;
        name: string;
        monthly_rent: string;
        property: {
            id: string;
            name: string;
        };
        status: string;
    };
    tenancyId?: string;
    onSuccess: () => void;
    hasTenant?: boolean;
}

const TenantAssignmentForm = ({ unit, tenancyId, onSuccess, hasTenant }: TenantAssignmentFormProps) => {
    const [full_name, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [id_number, setIdNumber] = useState('');
    const [billing_start_date, setBillingStartDate] = useState('');

    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [detailMessage, setDetailMessage] = useState<string | null>(null);

    const addTenantMutation = useAddTenant();

    const payload = {
        full_name,
        phone,
        email,
        id_number,
        billing_start_date,
        ...(unit?.id ? { unit: unit.id } : {}),
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        try {
            const response = await addTenantMutation.mutateAsync({
                unitId: unit.id,
                payload: payload
            });

            console.log("Assignment response", response);
            console.log("Payload", payload);

            if (response.success) {
                setDetailMessage(response.detail);
                setSuccess(true);
            } else {
                setErrors(response.errors);
                console.log("Assignment failed", response);
            }
        } catch (error: any) {
            setErrors({ general: [error.message || "An unexpected error occurred."] });
        }
    };

    // Maintenance Mode
    if (unit.status === 'maintenance') {
        return (
            <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-lg shadow-amber-100/50 p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative flex flex-col items-center justify-center space-y-5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-30"></div>
                        <div className="relative p-5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl border-2 border-amber-300 shadow-inner">
                            <Wrench className="h-10 w-10 text-amber-600" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-amber-800 flex items-center justify-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Maintenance in Progress
                        </h3>
                        <p className="text-sm font-medium text-amber-700 max-w-xs">
                            This unit is currently under maintenance and cannot be assigned.
                        </p>
                    </div>
                </div>
            </div>
        );
    }


    const inputClass = (field: string) => 
        `w-full px-4 pl-11 py-3.5 rounded-xl border-2 transition-all duration-200 outline-none text-gray-700 placeholder:text-gray-400 ${
            errors[field]
                ? 'bg-red-50 border-red-400 focus:ring-4 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-200 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
        }`;

    return (
        <div className="relative max-w-4xl mx-auto p-8 border-2 border-gray-200 rounded-2xl shadow-lg shadow-gray-200/50">
            {/* Success Overlay */}
            {success && (
                <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-2xl animate-in fade-in zoom-in duration-300">
                    <div className="text-center p-6 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-xl max-w-md">
                    <div className="relative inline-block">
                        <CircleCheckBig className="w-14 h-14 text-emerald-600 mx-auto" strokeWidth={1.5} />
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
                    </div>
                    <p className="font-bold text-xl text-emerald-800 mt-3">
                        {hasTenant ? 'Roommate Added!' : 'Tenant Assigned!'}
                    </p>

                    <p className="text-sm text-emerald-600 mt-1">
                        {hasTenant ? 'Roommate successfully added to the unit.' : 'Tenant successfully assigned to the unit.'}
                    </p>

                    <p className="text-sm text-emerald-600 mt-1">
                        {payload.email && ` A verification email has been sent to `}<span className="text-emerald-700 font-semibold">{payload.email}</span>
                    </p>

                    <button
                        onClick={() => { setSuccess(false); onSuccess(); }}
                        className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Continue
                    </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success Message */}
                {detailMessage && (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl animate-in slide-in-from-top-2 duration-300">
                        <CircleCheckBig className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">Success</p>
                            <p className="text-sm text-emerald-700">{detailMessage}</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="relative text-center pb-6 border-b border-gray-100">
                    {/* Decorative gradient */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-full" />
                    
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
                        {hasTenant ? (
                            <UserPlus className="w-8 h-8 text-white" />
                        ) : (
                            <UserCheck className="w-8 h-8 text-white" />
                        )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900">
                        {hasTenant ? "Add Roommate" : "Assign Tenant"}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2 mt-1.5 text-sm text-gray-500">
                        <Building2 className="w-4 h-4" />
                        <span>{unit?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{unit?.property.name}</span>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                className={inputClass('full_name')}
                                value={full_name}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter full name"
                            />
                        </div>
                        {errors.full_name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {errors.full_name[0]}
                            </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <Phone className="w-5 h-5" />
                            </div>
                            <input
                                type="tel"
                                className={inputClass('phone')}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+254 700 000 000"
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {errors.phone[0]}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                className={inputClass('email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {errors.email[0]}
                            </p>
                        )}
                    </div>

                    {/* ID Number */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                            ID Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                className={inputClass('id_number')}
                                value={id_number}
                                onChange={(e) => setIdNumber(e.target.value)}
                                placeholder="National ID / Passport"
                            />
                        </div>
                        {errors.id_number && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {errors.id_number[0]}
                            </p>
                        )}
                    </div>

                    {/* Billing Start Date */}
                    {!hasTenant && (
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                                Billing Start Date <span className="text-red-500">*</span>
                            </label>
                            <div className="relative max-w-xs">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <input
                                    type="date"
                                    className={inputClass('billing_start_date')}
                                    onChange={(e) => setBillingStartDate(e.target.value)}
                                    value={billing_start_date}
                                />
                            </div>
                            {errors.billing_start_date && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {errors.billing_start_date && errors.billing_start_date[0]}
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1 ml-1">
                                The date when billing for this tenant will commence
                            </p>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={!full_name || !phone || !id_number || (!hasTenant && !billing_start_date) || addTenantMutation.isPending}
                    className="relative w-full group overflow-hidden flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-blue-600/30"
                >
                    {addTenantMutation.isPending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            {hasTenant ? (
                                <UserPlus className="w-5 h-5" />
                            ) : (
                                <UserCheck className="w-5 h-5" />
                            )}
                            <span>{hasTenant ? 'Add Roommate' : 'Assign Tenant'}</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                {/* Footer Note */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>All tenant information is securely stored</span>
                </div>
            </form>
        </div>
    );
};

export default TenantAssignmentForm;