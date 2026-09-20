'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Menu, MenuItem, MenuItems, Transition } from "@headlessui/react";
import {
    Plus, Trash2, CheckCircle2, XCircle,
    Receipt, Info, AlertCircle, Loader2,
    MoreVertical, Wallet, UserRoundX,
    AlertTriangle, Search, X, RefreshCcw,
    ChevronDown, ChevronUp
} from "lucide-react";
import ConfirmModal from "@/app/components/modals/ConfirmModal";
import { useCharges } from "@/app/hooks/queries/useChargeQueries";
import { useChargeTypes } from "@/app/hooks/queries/useSettingsQueries";
import {
    useCreateCharge,
    useUpdateChargeStatus,
    useDeleteCharge,
} from "@/app/hooks/mutations/useChargeMutations";
import { useDebounce } from "@/app/hooks/useDebounce";
import { SearchInput } from '@/app/components/ui/SearchInput';
import Pagination from "@/app/components/ui/Pagination";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Link from "next/link";
import { Charge, ChargeType } from "@/app/src/types/Types";
import { useToast } from "@/app/providers/ToastProvider";
import RefreshButton from "../../ui/RefreshButton";

interface ChargesTabProps {
    unit: any;
    tenancyId: string | null;
}

const ChargesTab = ({ unit, tenancyId }: ChargesTabProps) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const effectiveSearch = debouncedSearch.trim();

    const { showToast} = useToast();

    const { 
        data: chargesData, 
        isLoading: loading, 
        isFetching,
        refetch 
    } = useCharges(
        page,
        pageSize,
        effectiveSearch,
        statusFilter,
        unit?.id,
        tenancyId,
        !!tenancyId
    );

    const { data } = useChargeTypes(1, 100, "", "True", !!tenancyId);
    const chargeTypes: ChargeType[] = data?.results ?? []; 
    
    const createCharge = useCreateCharge(tenancyId);
    const updateStatus = useUpdateChargeStatus(tenancyId);
    const deleteCharge = useDeleteCharge(tenancyId);

    const charges: Charge[] = chargesData?.results ?? [];
    const totalCount = chargesData?.count ?? 0;

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        charge_type: "",
        amount: "",
        description: "",
    });
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    const handleFilterChange = (setter: Function, value: any) => {
        setter(value);
        setPage(1);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setPage(1);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const typeId = e.target.value;
        const selectedType = chargeTypes.find((ct: ChargeType) => ct.id === typeId);
        setFormData(prev => ({
            ...prev,
            charge_type: typeId,
            amount: selectedType?.default_amount || ""
        }));
    };

    const handleCreateCharge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenancyId) return;

        console.log("Selected charge id:", formData.charge_type)
        if (!formData.charge_type || !formData.amount) {
            showToast("Missing Information!", "Please fill in all required fields", "error")
            setErrors({
                ...(formData.charge_type.trim() === "" && { chargeType: ["Charge type is required"]}),
                ...(formData.amount === "" && { amount: ["Charge amount is required"]})
            })
            console.log("Errors: ", errors)
        }

        try {
            const response = await createCharge.mutateAsync(formData);

            if (response.id) {
                setFormData({ charge_type: "", amount: "", description: "" });

                showToast('Charge Created!', 'Your charge has been created successfully.', 'success');
            } else {
                setErrors(response);
                console.log("Creation failed", response);
                showToast('Failed to create', 'Please check the form for errors.', 'error');
            }
        } catch (error) {
            console.error("Creation failed", error);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await updateStatus.mutateAsync({ id, status });
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleDeleteClick = (id: string) => {
        setSelectedChargeId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedChargeId) return;

        setDeleteError(null);

        const charge = charges.find((c: Charge) => c.id === selectedChargeId);
        if (charge?.status === "paid") {
            setDeleteError("This charge has already been marked as paid and can't be deleted.");
            return;
        }

        try {
            await deleteCharge.mutateAsync(selectedChargeId);
            setIsDeleteModalOpen(false);
            setSelectedChargeId(null);
            refetch();
        } catch (error: any) {
            console.error("Delete failed", error);
            const backendMessage = error?.response?.data?.detail
                || (Array.isArray(error?.response?.data) ? error.response.data[0] : null)
                || error?.message
                || "Something went wrong while deleting this charge. Please try again.";
            setDeleteError(backendMessage);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "paid": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "waived": return "bg-gray-100 text-gray-600 border-gray-200";
            case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-gray-50 text-gray-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "paid": return <CheckCircle2 className="w-3 h-3" />;
            case "waived": return <XCircle className="w-3 h-3" />;
            case "pending": return <AlertCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const submitting = createCharge.isPending || deleteCharge.isPending;

    if (!tenancyId) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-200 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                    <UserRoundX className="w-12 h-12 text-red-600 animate-bounce" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No Active Tenancy</h3>
                <p className="text-gray-400">Assign a tenant first to manage charges</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Add Charge Form - Collapsible */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                            <Plus size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">New Charge</h3>
                    </div>
                    {isFormExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                {isFormExpanded && (
                    <form onSubmit={handleCreateCharge} className="px-4 pb-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Type</label>
                                <select
                                    value={formData.charge_type}
                                    onChange={handleTypeChange}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">Select Type</option>
                                    {chargeTypes.map((ct: ChargeType) => (
                                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                                    ))}
                                </select>
                                {errors.chargeType && <p className="text-xs text-red-500 mt-1">{errors.chargeType}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Amount</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Description</label>
                                <input
                                    type="text"
                                    placeholder="Optional notes"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {chargeTypes.length === 0 ? (
                            <p className="text-xs text-gray-800">
                                No charge types found. Please <Link href="/landlord-portal/settings?tab=charges" className="text-blue-600 hover:underline">add a charge type</Link>.
                            </p>
                        ) : (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {createCharge.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                                Add Charge
                            </button>
                        )}
                    </form>
                )}
            </div>

            {/* Charges List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">
                        Charge History ({totalCount})
                    </h3>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <SearchInput 
                            onSearchChange={(value) => handleFilterChange(setSearchTerm, value)}
                        />
                        
                        <select
                            className="px-3 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            value={statusFilter}
                            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="waived">Waived</option>
                        </select>

                        <RefreshButton isFetching={isFetching} refetch={refetch} />

                        {(searchTerm || statusFilter) && (
                            <button
                                onClick={clearFilters}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Clear filters"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="py-10 flex justify-center">
                        <LoadingSpinner size="md" color="blue-600" label="Loading charges..." />
                    </div>
                ) : charges.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                            {charges.map((charge: Charge) => (
                                <div key={charge.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap items-center justify-between hover:border-gray-300 transition-colors shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                            <Receipt size={20} />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-gray-900">{charge.charge_type_name}</p>
                                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusStyles(charge.status)}`}>
                                                    {getStatusIcon(charge.status)}
                                                    {charge.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{charge.description || "No description"}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(charge.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                KES {Number(charge.amount).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {charge.status === 'pending' && (
                                                <Menu as="div" className="relative">
                                                    <Menu.Button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                        <MoreVertical className="w-5 h-5 text-gray-500" />
                                                    </Menu.Button>

                                                    <Transition
                                                        enter="transition duration-100 ease-out"
                                                        enterFrom="transform scale-95 opacity-0"
                                                        enterTo="transform scale-100 opacity-100"
                                                        leave="transition duration-75 ease-in"
                                                        leaveFrom="transform scale-100 opacity-100"
                                                        leaveTo="transform scale-95 opacity-0"
                                                    >
                                                        <Menu.Items className="absolute right-0 bottom-full mb-2 w-42 origin-bottom-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                            <div className="px-1 py-1">
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => handleUpdateStatus(charge.id, 'paid')}
                                                                            className={`${active ? 'bg-green-200' : 'text-gray-700'} group gap-2 flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                            title="Mark as Paid"
                                                                        >
                                                                            <CheckCircle2 size={18} /> Mark as Paid
                                                                        </button>
                                                                    )}
                                                                </MenuItem>
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => handleUpdateStatus(charge.id, 'waived')}
                                                                            className={`${active ? 'bg-amber-200' : 'text-gray-700'} group gap-2 flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                            title="Waive Charge"
                                                                        >
                                                                            <XCircle size={18} /> Waive Charge
                                                                        </button>
                                                                    )}
                                                                </MenuItem>
                                                            </div>
                                                        </Menu.Items>
                                                    </Transition>
                                                </Menu>
                                            )}
                                            <button
                                                onClick={() => handleDeleteClick(charge.id)}
                                                disabled={charge.status === 'paid'}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    charge.status === 'paid'
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-rose-500 hover:bg-rose-50'
                                                }`}
                                                title={charge.status === 'paid' ? "Cannot delete paid charges" : "Delete"}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination
                            page={page}
                            pageSize={pageSize}
                            totalCount={totalCount}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                        />
                    </>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dotted border-gray-200">
                        <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                            {searchTerm || statusFilter ? 'No charges match your filters' : 'No charges recorded for this tenancy'}
                        </p>
                        {(searchTerm || statusFilter) && (
                            <button
                                onClick={clearFilters}
                                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                icon={<AlertTriangle size={24} className="text-red-500" />}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteError(null);
                }}
                onConfirm={handleConfirmDelete}
                isLoading={deleteCharge.isPending}
                title="Permanently delete charge?"
                detail={deleteError && <p className="text-sm text-red-700 mt-1 bg-red-100 rounded-lg p-2">{deleteError}</p>}
                message="This action cannot be undone. All historical records of this charge will be removed from the system."
                message2="If you want to cancel the debt but keep a record, consider using 'WAIVE' instead."
                confirmText="Delete Permanently"
            />
        </div>
    );
};

export default ChargesTab;