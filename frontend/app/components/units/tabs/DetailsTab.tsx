'use client';

import React, { useState } from "react";
import {
    UserPlus, Shield, ChevronRight, Clock, UserRoundX,
    AlertTriangle,
} from "lucide-react";
import { Property } from "@/app/src/types/Types";
import TenantCard from "../TenantCard";
import RefreshButton from "../../ui/RefreshButton";
import TenantModal from "../../modals/TenantFormModal";
import { DetailsTabSkeleton } from "../../skeletons/UnitDetailsTabSkeleton";
import { useUnitTenants } from "@/app/hooks/queries/useUnitDetailQueries";
import { useToast } from "@/app/providers/ToastProvider";
import ConfirmModal from "../../modals/ConfirmModal";
import { useRemoveRoommate, useVacateUnit } from "@/app/hooks/mutations/useTenantMutations";

interface DetailsTabProps {
    property: Property | null;
    unit: any;
}

const DetailsTab = ({ unit, property }: DetailsTabProps) => {
    const unitId = unit?.id;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTenant, setModalTenant] = useState<any | null>(null);

    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [isRemoveRoommateModalOpen, setIsRemoveRoommateModalOpen] = useState(false);
    const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);

    const {
        data: tenantData,
        isPending,
        isFetching,
        refetch: refetchTenants,
    } = useUnitTenants(unitId);

    const tenants = tenantData?.tenants ?? [];

    const removeRoommate = useRemoveRoommate();
    const vacateUnit = useVacateUnit();
    const { showToast } = useToast();

    const handleOpenRemoveRoommateModal = (tenantId: string) => {
        setSelectedTenantId(tenantId);
        setIsRemoveRoommateModalOpen(true);
    };

    const handleRemoveRoommate = async () => {
        if (!selectedTenantId || !unitId || !property) return;
        try {
            await removeRoommate.mutateAsync({
                unitId,
                tenantId: selectedTenantId,
                propertyId: property.id,
            });
            showToast('Roommate Removed!', 'Roommate removed successfully', 'success');
            setIsRemoveRoommateModalOpen(false);
            setSelectedTenantId(null);
        } catch (error) {
            console.error('Failed to remove roommate:', error);
        }
    };

    const confirmRemoveTenancy = async () => {
        if (!unitId || !property) return;
        try {
            await vacateUnit.mutateAsync({
                unitId,
                propertyId: property.id,
            });
            showToast('Lease Terminated!', 'Lease terminated successfully', 'success');
            setIsVacateModalOpen(false);
        } catch (error) {
            console.error('Failed to vacate unit:', error);
        }
    };

    if (isPending) return <DetailsTabSkeleton />;

    const tenantList = Array.isArray(tenants) ? tenants : [];
    const hasTenants = tenantList.length > 0;

    const openCreate = () => { setModalTenant(null); setIsModalOpen(true); };
    const openEdit = (tenant: any) => { setModalTenant(tenant); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setModalTenant(null); };
    const handleSuccess = () => closeModal();

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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {tenantList.map((t: any) => (
                            <TenantCard
                                key={t.id}
                                tenant={t}
                                tenantsCount={tenantList.length}
                                onRemoveRoommate={handleOpenRemoveRoommateModal}
                                onEdit={openEdit}
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
                            onClick={() => setIsVacateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors active:scale-95"
                        >
                            Terminate Lease
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </>
            )}

            <TenantModal
                isOpen={isModalOpen}
                onClose={closeModal}
                tenant={modalTenant}
                unit={unit}
                onSuccess={handleSuccess}
            />

            {/* Modals */}
            <ConfirmModal
            isOpen={isVacateModalOpen}
            icon={<AlertTriangle size={24} className="text-red-500" />}
            title="Terminate Lease?"
            message="This will end the lease and remove all tenants from this unit."
            message2="If you only want to remove one tenant, use the 'Remove Tenant' button on their card instead."
            confirmText="Terminate Lease"
            isLoading={vacateUnit.isPending}
            onConfirm={confirmRemoveTenancy}
            onClose={() => setIsVacateModalOpen(false)}
            />

            <ConfirmModal
            isOpen={isRemoveRoommateModalOpen}
            icon={<AlertTriangle size={24} className="text-red-500" />}
            title="Remove Tenant?"
            message="Are you sure you want to remove this tenant from this unit?"
            message2="This action cannot be undone."
            confirmText="Remove Tenant"
            isLoading={removeRoommate.isPending}
            onConfirm={handleRemoveRoommate}
            onClose={() => {
                setIsRemoveRoommateModalOpen(false);
                setSelectedTenantId(null);
            }}
            />
        </div>
    );
};

export default DetailsTab;