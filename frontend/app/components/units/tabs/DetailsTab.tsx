'use client';

import React, { useState } from "react";
import {
    UserPlus, Shield, ChevronRight, Clock, UserRoundX,
    AlertTriangle, Pencil, Check, X as XIcon
} from "lucide-react";
import { Property } from "@/app/src/types/Types";
import TenantCard from "../TenantCard";
import RefreshButton from "../../ui/RefreshButton";
import TenantModal from "../../modals/TenantFormModal";
import { DetailsTabSkeleton } from "../../skeletons/UnitDetailsTabSkeleton";
import { useUnitTenants } from "@/app/hooks/queries/useUnitDetailQueries";
import { useToast } from "@/app/providers/ToastProvider";
import ConfirmModal from "../../modals/ConfirmModal";
import { useUpdateTenancyBillingStart, useRemoveRoommate, useVacateUnit } from "@/app/hooks/mutations/useTenantMutations";

interface DetailsTabProps {
    property: Property | null;
    unit: any;
}

const DetailsTab = ({ unit, property }: DetailsTabProps) => {
    const unitId = unit?.id;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTenant, setModalTenant] = useState<any | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [isRemoveRoommateModalOpen, setIsRemoveRoommateModalOpen] = useState(false);
    const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);

    const [isEditingBilling, setIsEditingBilling] = useState(false);
    const [billingDraft, setBillingDraft] = useState<string>("");
    const [isBillingConfirmOpen, setIsBillingConfirmOpen] = useState(false);
    const updateBillingStart = useUpdateTenancyBillingStart();

    const {
        data: tenantData,
        isPending,
        isFetching,
        refetch: refetchTenants,
    } = useUnitTenants(unitId);

    const BillingstartDate = tenantData?.tenancyBillingStart ?? null;
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

    const toInputDate = (value: string | null | undefined) => {
        if (!value) return "";
        return String(value).slice(0, 10); // Slice first 10 characters if ISO string
    };

    const openBillingEdit = () => {
        setBillingDraft(toInputDate(BillingstartDate));
        setIsEditingBilling(true);
    };

    const cancelBillingEdit = () => {
        setIsEditingBilling(false);
        setBillingDraft("");
    };

    const confirmBillingSave = async () => {
        if (!unitId || !property || !billingDraft) return;

        if (billingDraft === toInputDate(BillingstartDate)) {
            setIsBillingConfirmOpen(false);
            setIsEditingBilling(false);
            showToast("No Changes", "No changes were made to the billing start date.", "warning");
            return;
        }
        
        try {
            const res = await updateBillingStart.mutateAsync({
                unitId,
                propertyId: property.id,
                billingStartDate: billingDraft,
            });
            console.log(res)
            if (res.success) {
                showToast(
                    "Billing start updated",
                    "The billing start date has been saved.",
                    "success",
                );
                setIsBillingConfirmOpen(false);
                setIsEditingBilling(false);
            } else {
                setErrors({ general: [res.detail || "Failed to update billing start"] });
                showToast("Error","Failed to update billing start", "error");
            }
        } catch (error) {
            console.error("Failed to update billing start:", error);
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
                            {isEditingBilling ? (
                                <>
                                    <input
                                        type="date"
                                        value={billingDraft}
                                        onChange={(e) => setBillingDraft(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <button
                                        onClick={() => setIsBillingConfirmOpen(true)}
                                        disabled={!billingDraft || updateBillingStart.isPending}
                                        title="Save billing start date"
                                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={cancelBillingEdit}
                                        title="Cancel"
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs text-slate-500">
                                        {BillingstartDate
                                            ? `Billing starts ${new Date(BillingstartDate).toDateString()}`
                                            : "Billing start not set"}
                                    </span>
                                    <button
                                        onClick={openBillingEdit}
                                        title="Edit billing start date"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
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

            <ConfirmModal
                isOpen={isBillingConfirmOpen}
                icon={
                    errors.general ? (
                        <AlertTriangle size={24} className="text-red-500" />
                    ) : (
                        <AlertTriangle size={24} className="text-amber-500" />
                    )
                }
                title={
                    errors.general
                        ? "Billing Start Date Cannot Be Changed"
                        : "Update Billing Start Date?"
                }
                message={
                    errors.general
                        ? errors.general
                        : "Rent charges will be recalculated from the new billing start date."
                }
                message2={
                    errors.general
                        ? "Please contact support to correct this tenancy's billing history."
                        : "Existing rent charges before the new date will be voided, and any payments against them will become tenant credit."
                }
                confirmText={errors.general ? "Close" : "Save Date"}
                isLoading={!errors.general && updateBillingStart.isPending}
                onConfirm={errors.general ? () => setIsBillingConfirmOpen(false) : confirmBillingSave}
                onClose={() => setIsBillingConfirmOpen(false)}
            />
        </div>
    );
};

export default DetailsTab;