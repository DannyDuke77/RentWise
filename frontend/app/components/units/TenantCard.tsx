import { useEffect, useRef, useState } from 'react';
import {
    User, Mail, Phone, FileText, BadgeCheck,
    Calendar, Check, Copy, CreditCard, EllipsisVertical
} from "lucide-react";
import Link from 'next/link';
import { formatDate } from "@/app/src/utils/timeStore";

const TenantCard = ({ tenant, tenantsCount, onRemoveRoommate, onEdit }: any) => {
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

                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)} 
                        className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <EllipsisVertical className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200/80 rounded-xl shadow-xl z-20 overflow-hidden text-xs">
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onEdit(tenant); 
                                }} 
                                className="w-full text-left px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Edit Profile
                            </button>
                            {tenantsCount > 1 && (
                                <button 
                                    onClick={() => onRemoveRoommate(tenant.id)} 
                                    className="w-full text-left px-4 py-2.5 font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                                >
                                    Remove Tenant
                                </button>
                            )}
                        </div>
                    )}
                </div>
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

export default TenantCard;

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