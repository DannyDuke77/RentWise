'use client';

import React, { useState } from "react";
import {
    UserPlus, Shield, ChevronRight, Clock, UserRoundX,
} from "lucide-react";
import { Property } from "@/app/src/types/Types";
import TenantCard from "../TenantCard";
import RefreshButton from "../../ui/RefreshButton";
import TenantModal from "../../modals/TenantFormModal";

interface DetailsTabProps {
    property: Property | null;
    unit: any;
    tenants: any;
    refetchTenants: () => void;
    isFetching: boolean;
    onRemoveRoommate: (tenantId: string) => void;
    onRemoveTenancy: () => void;
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

const DetailsTab = ({
    unit,
    tenants,
    refetchTenants,
    isFetching,
    onRemoveRoommate,
    onRemoveTenancy,
}: DetailsTabProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTenant, setModalTenant] = useState<any | null>(null);

    if (isFetching) return <DetailsTabSkeleton />;

    const tenantList = Array.isArray(tenants) ? tenants : [];
    const hasTenants = tenantList.length > 0;

    const openCreate = () => {
        setModalTenant(null);
        setIsModalOpen(true);
    };
    const openEdit = (tenant: any) => {
        setModalTenant(tenant);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setModalTenant(null);
    };
    const handleSuccess = () => {
        closeModal();
    };

    return (
        <div className="space-y-6 pt-2 animate-in fade-in duration-200">
            {!hasTenants ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-200 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                            <UserRoundX className="w-12 h-12 text-red-600 animate-bounce" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">No Active Tenancy</h3>
                        <p className="text-gray-400">
                            Assign a tenant first to manage payments and track transactions
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" />
                        Assign Tenant
                    </button>
                </div>
            ) : (
                <>
                    {/* Section Controls */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                Occupancy Details
                            </h2>
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200/60">
                                {tenantList.length}{' '}
                                {tenantList.length === 1 ? 'Occupant' : 'Occupants'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors active:scale-95"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                Add Roommate
                            </button>
                            <RefreshButton isFetching={isFetching} refetch={refetchTenants} />
                        </div>
                    </div>

                    {/* Occupant cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {tenantList.map((t: any) => (
                            <TenantCard
                                key={t.id}
                                tenant={t}
                                tenantsCount={tenantList.length}
                                onRemoveRoommate={onRemoveRoommate}
                                onEdit={openEdit}
                            />
                        ))}
                    </div>

                    {/* Lease footer */}
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
            )}

            {/* Tenant Modal */}
            <TenantModal
                isOpen={isModalOpen}
                onClose={closeModal}
                tenant={modalTenant}
                unit={unit}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default DetailsTab;