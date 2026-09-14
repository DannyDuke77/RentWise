'use client';

import React, { useState, useEffect } from "react";
import {
    User, Mail, Phone, FileText, UserPlus, UserCheck,
    Wrench, AlertTriangle, CircleCheckBig, Building2,
    Calendar, Shield, ChevronRight, Save, Pencil,
} from "lucide-react";
import Modal from "../ui/Modal";
import { useAddTenant, useUpdateTenant } from "@/app/hooks/mutations/useTenantMutations";
import { useToast } from "@/app/providers/ToastProvider";

interface TenantUnit {
    id: string;
    name: string;
    monthly_rent?: string;
    property: { id: string; name: string };
    status: string;
}

interface Tenant {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    id_number?: string;
}

interface TenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** When provided → edit mode. When omitted → create mode. */
    tenant?: Tenant | null;
    /** Required in create mode. Ignored in edit mode. */
    unit?: TenantUnit | null;
    onSuccess?: () => void;
}

type Mode = 'create' | 'edit';

const TenantModal = ({ isOpen, onClose, tenant, unit, onSuccess }: TenantModalProps) => {
    const mode: Mode = tenant ? 'edit' : 'create';
    const isEdit = mode === 'edit';

    const [full_name, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [id_number, setIdNumber] = useState('');
    const [billing_start_date, setBillingStartDate] = useState('');

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);
    const [detailMessage, setDetailMessage] = useState<string | null>(null);

    const { showToast } = useToast();
    const addTenantMutation = useAddTenant();
    const updateTenantMutation = useUpdateTenant();

    const isPending = addTenantMutation.isPending || updateTenantMutation.isPending;
    const hasTenant = unit?.status === 'occupied';

    // Reset / hydrate on open
    useEffect(() => {
        if (!isOpen) return;
        if (isEdit && tenant) {
            setFullName(tenant.full_name || '');
            setPhone(tenant.phone || '');
            setEmail(tenant.email || '');
            setIdNumber(tenant.id_number || '');
        } else {
            setFullName('');
            setPhone('');
            setEmail('');
            setIdNumber('');
            setBillingStartDate('');
        }
        setErrors({});
        setSuccess(false);
        setDetailMessage(null);
    }, [isOpen, isEdit, tenant]);

    const clearError = (field: string) => {
        setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const hasChanges =
        full_name !== (tenant?.full_name || '') ||
        phone !== (tenant?.phone || '') ||
        email !== (tenant?.email || '') ||
        id_number !== (tenant?.id_number || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPending) return;
        setErrors({});
        setSuccess(false);
        setDetailMessage(null);

        if (!full_name || !phone || !id_number) {
            showToast("Missing Information!", "Please fill in all required fields", "error")
            setErrors({
                ...(full_name.trim() === "" && { full_name: ["Tenant name is required"]}),
                ...(phone === "" && { phone: ["Phone number is required"]}),
                ...(id_number === "" && { id_number: ["ID number is required"]}),
                ...(billing_start_date === "" && { billing_start_date: ["Billing start date is required"]}),
            })
            return;
        }

        try {
            if (isEdit && tenant) {
                if (!hasChanges) {
                    showToast('No Changes', 'No changes were made to the tenant.', 'warning');
                    return;
                }
                // ---- EDIT ----
                const payload: Record<string, string> = {};
                if (full_name !== tenant.full_name) payload.full_name = full_name;
                if (phone !== (tenant.phone || '')) payload.phone = phone;
                if (email !== (tenant.email || '')) payload.email = email;
                if (id_number !== (tenant.id_number || '')) payload.id_number = id_number;

                if (Object.keys(payload).length === 0) {
                    onClose();
                    return;
                }

                await updateTenantMutation.mutateAsync({ tenantId: tenant.id, payload });
                showToast('Updated!', 'Tenant details updated successfully.', 'success');
                onSuccess?.();
                onClose();
            } else {
                // ---- CREATE ----
                if (!unit) return;
                const payload = { full_name, phone, email, id_number, billing_start_date };
                const response = await addTenantMutation.mutateAsync({
                    unitId: unit.id,
                    payload,
                    propertyId: unit.property.id,
                });


                if (response.success) {
                    setDetailMessage(response.detail);
                    setSuccess(true);
                    showToast(
                        hasTenant ? 'Roommate Assigned!' : 'Tenant Assigned!',
                        hasTenant ? 'Roommate assigned successfully.' : 'Tenant assigned successfully.',
                        'success'
                    );
                    onSuccess?.();
                } else {
                    showToast('Failed!', 'Failed to assign tenant.', 'error');
                    setErrors(response.errors);
                    console.log("Failed to assign tenant:", response.errors);
                }
            }
        } catch (error: any) {
            const apiErrors = error?.response?.data?.errors;

            if (apiErrors) {
                setErrors(apiErrors);
            } else {
                setErrors({
                    general: [error.message || 'An unexpected error occurred.']
                });
            }
        }
    };

    // ---- Maintenance block ----
    if (!isEdit && unit?.status === 'maintenance') {
        const maintenanceContent = (
            <div className="p-6">
                <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8">
                    <div className="flex flex-col items-center justify-center space-y-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-30" />
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
            </div>
        );
        return (
            <Modal
                label="Assign Tenant"
                isOpen={isOpen}
                close={onClose}
                content={maintenanceContent}
                maxWidth="max-w-2xl"
            />
        );
    }

    const inputClass = (field: string) =>
        `w-full px-4 pl-11 py-3.5 rounded-xl border-2 transition-all duration-200 outline-none text-gray-700 placeholder:text-gray-400 ${
            errors[field]
                ? 'bg-red-50 border-red-400 focus:ring-4 focus:ring-red-200 focus:border-red-500'
                : 'border-gray-200 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
        }`;

    const HeaderIcon = isEdit ? Pencil : hasTenant ? UserPlus : UserCheck;

    const content = (
        <div className="p-6 space-y-6 relative">
            {/* Success overlay */}
            {!isEdit && success && (
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
                            {hasTenant
                                ? 'Roommate successfully added to the unit.'
                                : 'Tenant successfully assigned to the unit.'}
                        </p>
                        {email && (
                            <p className="text-sm text-emerald-600 mt-1">
                                A verification email has been sent to{' '}
                                <span className="text-emerald-700 font-semibold">{email}</span>
                            </p>
                        )}
                        <button
                            onClick={onClose}
                            className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            <form className="space-y-6">
                {detailMessage && !success && (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                        <CircleCheckBig className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">Success</p>
                            <p className="text-sm text-emerald-700">{detailMessage}</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="relative text-center pb-6 border-b border-gray-100">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-full" />
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
                        <HeaderIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Tenant' : hasTenant ? 'Add Roommate' : 'Assign Tenant'}
                    </h3>
                    {!isEdit && unit && (
                        <div className="flex items-center justify-center gap-2 mt-1.5 text-sm text-gray-500">
                            <Building2 className="w-4 h-4" />
                            <span>{unit.name}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{unit.property.name}</span>
                        </div>
                    )}
                    {isEdit && tenant && (
                        <p className="text-sm text-gray-500 mt-1.5">
                            Updating profile for <span className="font-semibold text-gray-700">{tenant.full_name}</span>
                        </p>
                    )}
                </div>

                {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Error</p>
                            <p className="text-sm text-red-700">{errors.general[0]}</p>
                        </div>
                    </div>
                )}

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className={inputClass('full_name')}
                                value={full_name}
                                onChange={(e) => { setFullName(e.target.value); clearError('full_name'); }}
                                placeholder="Enter full name"
                            />
                        </div>
                        {errors.full_name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />{errors.full_name[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                            Phone Number {!isEdit && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                className={inputClass('phone')}
                                value={phone}
                                onChange={(e) => { setPhone(e.target.value); clearError('phone'); }}
                                placeholder="+254 700 000 000"
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />{errors.phone[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                className={inputClass('email')}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />{errors.email[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                            ID Number {!isEdit && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className={inputClass('id_number')}
                                value={id_number}
                                onChange={(e) => { setIdNumber(e.target.value); clearError('id_number'); }}
                                placeholder="National ID / Passport"
                            />
                        </div>
                        {errors.id_number && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />{errors.id_number[0]}
                            </p>
                        )}
                    </div>

                    {/* Billing start date — create mode only, and only when assigning the primary tenant */}
                    {!isEdit && !hasTenant && (
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                                Billing Start Date <span className="text-red-500">*</span>
                            </label>
                            <div className="relative max-w-xs">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    className={inputClass('billing_start_date')}
                                    value={billing_start_date}
                                    onChange={(e) => { setBillingStartDate(e.target.value); clearError('billing_start_date'); }}
                                />
                            </div>
                            {errors.billing_start_date && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />{errors.billing_start_date[0]}
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1 ml-1">
                                The date when billing for this tenant will commence
                            </p>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="relative w-full group overflow-hidden flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{isEdit ? 'Saving...' : 'Processing...'}</span>
                        </>
                    ) : isEdit ? (
                        <>
                            <Save className="w-5 h-5" />
                            <span>Save Changes</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    ) : (
                        <>
                            {hasTenant ? <UserPlus className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                            <span>{hasTenant ? 'Add Roommate' : 'Assign Tenant'}</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>All tenant information is securely stored</span>
                </div>
            </form>
        </div>
    );

    return (
        <Modal
            label={isEdit ? 'Edit Tenant' : hasTenant ? 'Add Roommate' : 'Assign Tenant'}
            isOpen={isOpen}
            close={onClose}
            content={content}
            maxWidth="max-w-2xl"
        />
    );
};

export default TenantModal;