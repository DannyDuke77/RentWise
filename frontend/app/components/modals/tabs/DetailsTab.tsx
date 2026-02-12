'use client';

import React, { useState, useRef, useEffect } from "react";
import { formatDate } from "@/app/src/utils/timeStore";
import { 
    User, Phone, Mail, Home, FileText, 
    UserPlus, AlertCircle, EllipsisVertical, Copy, Check 
} from "lucide-react";

interface DetailsTabProps {
    unit: any;
    tenants: any;
    loading: boolean;
    onRemoveRoommate: (tenantId: string) => void;
    onRemoveTenancy: () => void;
    onAssignClick: () => void;
}

// --- Atomic Skeleton Component ---
const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

// --- Full Tab Skeleton ---
const DetailsTabSkeleton = () => (
    <div className="space-y-8">
        <div className="h-32 w-full bg-gray-100 rounded-2xl p-6 flex justify-between items-center">
            <div className="space-y-3">
                <div className="flex items-center gap-4"><Skeleton className="w-8 h-8" /><Skeleton className="w-32 h-8" /></div>
                <Skeleton className="w-48 h-4 ml-12" />
            </div>
            <div className="text-right space-y-2"><Skeleton className="w-24 h-8 ml-auto" /><Skeleton className="w-20 h-3 ml-auto" /></div>
        </div>
        <div className="space-y-4">
            <Skeleton className="w-32 h-4 ml-1" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                        <div className="p-4 bg-gray-50 flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2"><Skeleton className="w-24 h-4" /><Skeleton className="w-16 h-3" /></div>
                        </div>
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(j => (
                                <div key={j} className="flex gap-3"><Skeleton className="w-8 h-8" /><div className="space-y-1"><Skeleton className="w-12 h-2" /><Skeleton className="w-32 h-4" /></div></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const DetailsTab = ({ unit, tenants, loading, onRemoveRoommate, onRemoveTenancy, onAssignClick }: DetailsTabProps) => {

    const getFloorDisplay = (floor: string) => {
        const num = Number(floor);
        if (Number.isNaN(num)) return floor;
        if (num === 0) return 'Ground Floor';
        const suffix = (num % 10 === 1 && num % 100 !== 11) ? 'st' : 
                       (num % 10 === 2 && num % 100 !== 12) ? 'nd' : 
                       (num % 10 === 3 && num % 100 !== 13) ? 'rd' : 'th';
        return `${num}${suffix} Floor`;
    };

    if (loading) return <DetailsTabSkeleton />;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Unit Info Card */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg text-white transition-all hover:scale-[1.01]">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <Home className="w-6 h-6 opacity-90" />
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold">{unit?.name}</h2>
                        {tenants && tenants.length > 0 && (
                            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                                {tenants.length} {tenants.length === 1 ? 'Tenant' : 'Tenants'}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-blue-100">{getFloorDisplay(unit?.floor)} • {unit?.property?.name}</p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                    <div className="text-2xl font-bold">KES {unit?.monthly_rent?.toLocaleString()}</div>
                    <div className="text-[10px] uppercase font-semibold tracking-wider opacity-80">Monthly Rent</div>
                </div>
            </div>

            {/* Tenants Section */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Occupancy Details</h3>

                {tenants && tenants.length > 0 ? (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tenants.map((t: any) => (
                            <TenantCard
                                key={t.id}
                                tenant={t}
                                tenantsCount={tenants.length}
                                onRemoveRoommate={onRemoveRoommate}
                            />
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={onRemoveTenancy} 
                            className="flex items-center gap-2 px-5 py-3 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition-all active:scale-95 text-sm font-bold"
                        >
                            Terminate Lease
                        </button>
                    </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <AlertCircle className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium mb-4">This unit is currently vacant</p>
                        <button 
                            onClick={onAssignClick}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"
                        >
                            <UserPlus className="w-4 h-4" />
                            Assign Tenant
                        </button>
                    </div>
                )}
            </div>
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
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User className="w-5 h-5" /></div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 max-w-[150px] truncate" title={tenant.full_name}>{tenant.full_name}</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Active Tenant</p>
                        <p className="text-[10px] text-gray-400">Joined: {formatDate(tenant.created_at, true)}</p>
                    </div>
                </div>

                {tenantsCount > 1 && (
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-full hover:bg-gray-200 transition-colors"><EllipsisVertical className="w-5 h-5 text-gray-500" /></button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                                <button onClick={() => onRemoveRoommate(tenant.id)} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t border-gray-100">Remove</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 space-y-4">
                <DetailItem icon={<Phone className="w-4 h-4 text-gray-500" />} label="Phone" value={tenant.phone || 'N/A'} link={`tel:${tenant.phone}`} copyValue={tenant.phone} />
                <DetailItem icon={<Mail className="w-4 h-4 text-gray-500" />} label="Email" value={tenant.email || 'N/A'} link={tenant.email ? `mailto:${tenant.email}` : undefined} copyValue={tenant.email} />
                <DetailItem icon={<FileText className="w-4 h-4 text-gray-500" />} label="ID Number" value={tenant.id_number || 'Not Provided'} />
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
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{label}</p>
                    {link ? (
                        <a href={link} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">{value}</a>
                    ) : (
                        <p className="text-sm font-medium text-gray-700">{value}</p>
                    )}
                </div>
            </div>
            {copyValue && (
                <button 
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400 hover:text-blue-600'}`}
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
            )}
        </div>
    );
};

export default DetailsTab;