'use client';

import React, { useState } from "react";
import { User, Mail, Phone, FileText, UserPlus, UserCheck, CheckCircle, Wrench, AlertTriangle, Clock } from "lucide-react";
import apiService from "@/app/services/apiService";

interface Props {
    unit: any;
    tenancyId?: string;
    onSuccess: () => void;
    hasTenant?: boolean;
}

const TenantAssignmentForm = ({ unit, tenancyId, onSuccess, hasTenant }: Props) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [detailError, setDetailError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        id_number: ''
    });

    const handleUnitStatusChange = () => {

    };

    if (unit.status === 'maintenance') {
        return (
            <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl shadow-sm">
                <div className="flex flex-col items-center justify-center space-y-4">
                    {/* Icon container */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-700 rounded-full animate-ping opacity-20"></div>
                        <div className="relative p-4 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full border-2 border-yellow-300 shadow-inner">
                            <Wrench className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-yellow-800 flex items-center justify-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Maintenance in Progress
                        </h3>
                        <p className="text-sm font-medium text-yellow-700">
                            This unit is currently under maintenance.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => data.append(key, value));

            let response;

            if (hasTenant) {
                // Add roommate
                if (!tenancyId) throw new Error("Tenancy ID required to add roommate");
                response = await apiService.post(
                    `/api/properties/tenancies/${tenancyId}/roommates/add/`,
                    data
                );
            } else {
                // Assign tenant to empty unit
                response = await apiService.post(
                    `/api/properties/unit/${unit.id}/assign-tenant/`,
                    data
                );
            }

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setDetailError(response.detail);
                setErrors(response.errors || {});
            }
        } catch (error: any) {
            setErrors({ general: [error.message || "An unexpected error occurred."] });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field: string) => `w-full px-4 pl-11 py-3 rounded-xl border transition-all outline-none ${
        errors[field] ? 'bg-red-50 border-2 border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
    }`;

    return (
        <div className="relative">
            {success && (
                <div className="absolute inset-0 z-20 bg-white/90 flex items-center justify-center rounded-xl animate-in fade-in duration-300">
                    <div className="text-center p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl shadow-xl">
                        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                        <p className="font-bold text-emerald-800">{hasTenant ? 'Roommate Added!' : 'Tenant Assigned!'}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {detailError && 
                    <p className="text-red-700 text-sm w-full bg-red-100 py-2 px-4 rounded-xl"><strong>Error:</strong> {detailError}</p>
                }

                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <UserPlus className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{hasTenant ? "Add Roommate" : "Assign Tenant"}</h3>
                    <p className="text-sm text-gray-500">Unit {unit?.name} • {unit?.property?.name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Full Name <span className="text-sm text-red-600">*</span></label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className={inputClass('full_name')}
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        {errors.full_name && <p className="text-red-600 text-xs mt-1">{errors.full_name[0]}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Phone Number <span className="text-sm text-red-600">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                className={inputClass('phone')}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+254..."
                            />
                        </div>
                        {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone[0]}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                className={inputClass('email')}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>}
                    </div>

                    {/* ID Number */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">ID Number <span className="text-sm text-red-600">*</span></label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className={inputClass('id_number')}
                                value={formData.id_number}
                                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                                placeholder="National ID / Passport"
                            />
                        </div>
                        {errors.id_number && <p className="text-red-600 text-xs mt-1">{errors.id_number[0]}</p>}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserCheck className="w-5 h-5" />}
                    {loading ? 'Processing...' : hasTenant ? 'Add Roommate' : 'Assign Tenant'}
                </button>
            </form>
        </div>
    );
};

export default TenantAssignmentForm;
