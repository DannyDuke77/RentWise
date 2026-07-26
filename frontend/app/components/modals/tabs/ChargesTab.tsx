'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Menu, MenuItem, MenuItems, Transition } from "@headlessui/react";
import apiService from "@/app/services/apiService";
import { 
    Plus, Trash2, CheckCircle2, XCircle, 
    Receipt, Info, AlertCircle, Loader2,
    MoreVertical,
    AlertTriangle, 
} from "lucide-react";
import ConfirmModal from "../ConfirmModal";

export interface ChargeType {
    id: string;
    name: string;
    default_amount: string;
}

interface Charge {
    id: string;
    charge_type_name: string;
    amount: string;
    description: string;
    status: string;
    created_at: string;
}

interface ChargesTabProps {
    unit: any;
    tenancyId?: string | null;
    chargeTypes?: ChargeType[];
    onPendingStatusChange: (hasPending: boolean) => void;
}

const ChargesTab = ({ unit, tenancyId, chargeTypes, onPendingStatusChange }: ChargesTabProps) => {
    const [charges, setCharges] = useState<Charge[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        charge_type: "",
        amount: "",
        description: "",
    });


    const fetchCharges = useCallback(async () => {
        if (!tenancyId) return;
        setLoading(true);
        try {
            const data = await apiService.get(`/api/charges/?tenancy=${tenancyId}`);
            const list = Array.isArray(data.results) ? data.results : [];
            setCharges(list);

            const hasPending = list.some((c: Charge) => c.status === "pending");
            onPendingStatusChange(hasPending);
        } catch (error) {
            console.error("Failed to fetch charges", error);
        } finally {
            setLoading(false);
        }
    }, [tenancyId, onPendingStatusChange]);

    useEffect(() => {
        fetchCharges();
    }, [fetchCharges]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const typeId = e.target.value;
        const selectedType = chargeTypes?.find(ct => ct.id === typeId);
        setFormData(prev => ({
            ...prev,
            charge_type: typeId,
            amount: selectedType?.default_amount || ""
        }));
    };

    const handleCreateCharge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenancyId) return;
        
        setSubmitting(true);
        try {
            await apiService.post("/api/charges/", {
                ...formData,
                tenancy: tenancyId,
            });
            setFormData({ charge_type: "", amount: "", description: "" });
            fetchCharges();
        } catch (error) {
            console.error("Creation failed", error);
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await apiService.patch(`/api/charges/${id}/update-status/`, { status });
            fetchCharges();
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
        
        setSubmitting(true);
        setDeleteError(null);
 
        const charge = charges.find(c => c.id === selectedChargeId);
        if (charge?.status === "paid") {
            setDeleteError("This charge has already been marked as paid and can't be deleted.");
            setSubmitting(false);
            return;
        }
        
        try {
            await apiService.delete(`/api/charges/${selectedChargeId}/`);
            fetchCharges();
            setIsDeleteModalOpen(false);
            setSelectedChargeId(null);
        } catch (error: any) {
            console.error("Delete failed", error);
            const backendMessage = error?.response?.data?.detail
                || (Array.isArray(error?.response?.data) ? error.response.data[0] : null)
                || error?.message
                || "Something went wrong while deleting this charge. Please try again.";
            setDeleteError(backendMessage);
        } finally {
            setSubmitting(false);
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

    if (!tenancyId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-gray-50">
                <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No active tenancy found.</p>
                <p className="text-xs text-gray-400">Assign a tenant first to manage charges.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Add Charge Form */}
            <form onSubmit={handleCreateCharge} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                        <Plus size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">New Charge</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Type</label>
                        <select
                            required
                            value={formData.charge_type}
                            onChange={handleTypeChange}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="">Select Type</option>
                            {chargeTypes?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Amount</label>
                        <input
                            type="number"
                            required
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
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
                {chargeTypes?.length === 0 ? 
                    <p className="text-xs text-gray-800">No charge types found. Please <a href="/settings?tab=charges" className="text-blue-600 hover:underline">add a charge type</a>.</p>
                :
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                        Add Charge
                    </button>
                }
            </form>

            {/* Charges List */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Charge History</h3>
                
                {loading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-gray-300" /></div>
                ) : charges.length > 0 ? (
                    <div className="grid gap-3">
                        {charges.map((charge) => (
                            <div key={charge.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:border-gray-300 transition-colors shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                        <Receipt size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900">{charge.charge_type_name}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusStyles(charge.status)}`}>
                                                {charge.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{charge.description || "No description"}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(charge.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">KES {Number(charge.amount).toLocaleString()}</p>
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
                                                    <MenuItems className="absolute right-0 bottom-full mb-2 w-42 origin-bottom-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                        <div className="px-1 py-1">
                                                            <MenuItem>
                                                                {({ active }) => (
                                                                    <button 
                                                                        onClick={() => updateStatus(charge.id, 'paid')} 
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
                                                                        onClick={() => updateStatus(charge.id, 'waived')} 
                                                                        className={`${active ? 'bg-amber-200' : 'text-gray-700'} group gap-2 flex w-full items-center rounded-md px-2 py-2 text-sm`} 
                                                                        title="Waive Charge"
                                                                    >
                                                                        <XCircle size={18} /> Waive Charge
                                                                    </button> 
                                                                )}
                                                            </MenuItem>
                                                        </div>
                                                    </MenuItems>
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

                                        <ConfirmModal 
                                            isOpen={isDeleteModalOpen}
                                            icon={<AlertTriangle size={24} className="text-red-500" />}
                                            onClose={() => setIsDeleteModalOpen(false)}
                                            onConfirm={handleConfirmDelete}
                                            isLoading={submitting}
                                            title="Permanently delete charge?"
                                            detail={deleteError && <p className="text-sm text-red-700 mt-1 bg-red-100 rounded-lg p-2">{deleteError}</p>}
                                            message="This action cannot be undone. All historical records of this charge will be removed from the system."
                                            message2="If you want to cancel the debt but keep a record, consider using 'WAIVE' instead."
                                            confirmText="Delete Permanently"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dotted border-gray-200">
                        <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No charges recorded for this tenancy</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChargesTab;