'use client';

import React, { useState, useRef, useEffect } from "react";
import { formatDate } from "@/app/src/utils/timeStore";
import { 
    User, Phone, Mail, FileText, 
    UserPlus, EllipsisVertical, Copy, Check,
    Calendar, CreditCard, Shield,
    ChevronRight, Clock, BadgeCheck, DoorOpen,
    RefreshCcw,
    UserRoundX
} from "lucide-react";
import { Property } from "@/app/src/types/Types";
import Link from "next/link";

interface DetailsTabProps {
    property: Property | null;
    unit: any;
    tenants: any;
    refetchTenants: () => void;
    loading: boolean;
    onRemoveRoommate: (tenantId: string) => void;
    onRemoveTenancy: () => void;
    onAssignClick: () => void;
}

const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
);

const DetailsTabSkeleton = () => (
    <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-28 h-9" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
                <div key={i} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="w-36 h-6" />
                            <Skeleton className="w-24 h-3" />
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map(j => (
                            <div key={j} className="flex gap-3">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="w-20 h-2" />
                                    <Skeleton className="w-44 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const DetailsTab = ({ tenants, refetchTenants, loading, onRemoveRoommate, onRemoveTenancy, onAssignClick }: DetailsTabProps) => {

    if (loading) return <DetailsTabSkeleton />;

    const tenantList = Array.isArray(tenants) ? tenants : [];
    const hasTenants = tenantList.length > 0;

    if (!hasTenants) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-200 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                        <UserRoundX className="w-12 h-12 text-red-600 animate-bounce" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">No Active Tenancy</h3>
                    <p className="text-gray-400">Assign a tenant first to manage payments and track transactions</p>
                </div>
                <button 
                    onClick={onAssignClick}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors active:scale-95"
                >
                    <UserPlus className="w-4 h-4" />
                    Assign Tenant
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6 pt-2 animate-in fade-in duration-200">
            {/* Section Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Occupancy Details</h2>
                    {hasTenants && (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200/60">
                            {tenantList.length} {tenantList.length === 1 ? 'Occupant' : 'Occupants'}
                        </span>
                    )}
                </div>

                <button
                    onClick={() => refetchTenants()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Occupants / Vacant State */}
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {tenantList.map((t: any) => (
                            <TenantCard
                                key={t.id}
                                tenant={t}
                                tenantsCount={tenantList.length}
                                onRemoveRoommate={onRemoveRoommate}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/80">
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">
                            <Shield className="w-4 h-4 text-emerald-600" />
                            <span>Active lease agreement</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                Ongoing
                            </span>
                        </div>

                        <button 
                            onClick={onRemoveTenancy} 
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors active:scale-95"
                        >
                            Terminate Lease
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </>
    
        </div>
    );
};

const TenantCard = ({ tenant, tenantsCount, onRemoveRoommate }: any) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-slate-300 transition-all overflow-hidden">
            {/* Card Header */}
            <div className="relative p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="relative">
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-semibold">
                            <User className="w-6 h-6" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>

                    <div>
                        <p className="text-base font-bold text-slate-900 leading-tight" title={tenant.full_name}>
                            {tenant.full_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <BadgeCheck className="w-3 h-3" />
                                Active
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Joined {formatDate(tenant.created_at, true)}
                            </span>
                        </div>
                    </div>
                </div>

                {tenantsCount > 1 && (
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setMenuOpen(!menuOpen)} 
                            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <EllipsisVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200/80 rounded-xl shadow-xl z-20 overflow-hidden text-xs">
                                <button className="w-full text-left px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                    Edit Profile
                                </button>
                                <button 
                                    onClick={() => onRemoveRoommate(tenant.id)} 
                                    className="w-full text-left px-4 py-2.5 font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                                >
                                    Remove Tenant
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Contact & ID Info */}
            <div className="p-5 space-y-3">
                <DetailItem 
                    icon={<Phone className="w-4 h-4 text-slate-400" />} 
                    label="Phone" 
                    value={tenant.phone || 'Not provided'} 
                    link={tenant.phone ? `tel:${tenant.phone}` : undefined} 
                    copyValue={tenant.phone} 
                />
                <DetailItem 
                    icon={<Mail className="w-4 h-4 text-slate-400" />} 
                    label="Email" 
                    value={tenant.email || 'Not provided'} 
                    link={tenant.email ? `mailto:${tenant.email}` : undefined} 
                    copyValue={tenant.email} 
                />
                <DetailItem 
                    icon={<FileText className="w-4 h-4 text-slate-400" />} 
                    label="ID Number" 
                    value={tenant.id_number || 'Not Provided'} 
                />

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[12px] font-medium text-slate-400">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rent status:</span>
                    <span className="text-emerald-600 font-semibold">Current</span>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value, link, copyValue }: any) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!copyValue) return;
        navigator.clipboard.writeText(copyValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors -mx-2">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
                    {link ? (
                        <Link href={link} className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors truncate block tracking-wide">
                            {value}
                        </Link>
                    ) : (
                        <p className="text-sm font-semibold text-slate-700 truncate tracking-wide">{value}</p>
                    )}
                </div>
            </div>
            {copyValue && (
                <button 
                    onClick={handleCopy}
                    className={`p-1.5 rounded-lg transition-all flex-shrink-0 ml-2 ${copied ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            )}
        </div>
    );
};

export default DetailsTab;