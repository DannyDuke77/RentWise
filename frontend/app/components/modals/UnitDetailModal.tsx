'use client';

import React, { useState, useEffect } from "react";
import useUnitDetailModal from "@/app/hooks/useUnitDetailModal";
import Modal from "./Modal";
import { Building2, Home, Save, UserPlus, History, UserCircle, ArrowRight } from "lucide-react";
import apiService from "@/app/services/apiService";
import { useRouter } from "next/navigation";

// Sub-components
import DetailsTab from "./tabs/DetailsTab";
import TenantAssignmentForm from "./tabs/TenantAssignmentForm";
import PaymentTab from "./tabs/PaymentTab";
import LogsTab from "./tabs/LogsTab";
import TabHeader from "./TabHeader";
import ChargesTab from "./tabs/ChargesTab";

const UnitDetailModal = () => {
    const { unit, isOpen, close, isEditing: initialIsEditing } = useUnitDetailModal();
    const unitDetailModal = useUnitDetailModal();
    const [currentTab, setCurrentTab] = useState<'details' | 'tenant' | 'payment' | 'charges' | 'logs'>('details');
    const [tenants, setTenants] = useState<any[]>([]);
    const [tenancyId, setTenancyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [hasPendingCharges, setHasPendingCharges] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        monthly_rent: 0,
        floor: '0',
        status: "vacant",
    });


    const fetchTenants = async () => {
        if (!unit?.id) return;
        setLoading(true);
        try {
            const res = await apiService.get(`/api/tenants/unit/${unit.id}/`);
            setTenants(res.tenants || []);
            const tId = res.tenancy_id || null;
            setTenancyId(tId);

            if (tId) {
                const chargesData = await apiService.get(`/api/charges/?tenancy=${tId}`);
                const hasPending = chargesData.some((c: any) => c.status === "pending");
                setHasPendingCharges(hasPending);
            }
        } catch (error) {
            setTenants([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, [unit?.id]);

    const handleRemoveRoommate = async (tenantId: string) => {
        if (!tenancyId || !confirm("Remove this tenant from the unit?")) return;

        setLoading(true);
        try {
            await apiService.post(`/api/units/${unit?.id}/remove-roommate/${tenantId}/`, {});

            // remove ONLY this tenant from UI
            setTenants((prev: any[]) =>
                prev.filter(t => t.id !== tenantId)
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTenancy = async () => {
        if (!confirm(
            "This will end the lease and clear all tenants from this unit. " +
            "Want to remove just one tenant? Use the 'Remove Tenant' button on their card instead. Continue?"
        )) return;

        setLoading(true);
        try {
            await apiService.post(`/api/units/${unit?.id}/vacate/`, {});
            fetchTenants();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsEditing(initialIsEditing);
    }, [initialIsEditing, isOpen]);

    useEffect(() => {
        if (unit) {
            setFormData({
                name: unit.name || "",
                monthly_rent: unit.monthly_rent || 0,
                floor: unit.floor || "0",
                status: unit.status || "vacant",
            });
        }
    }, [unit]);

    const handleUpdate = async () => {
        if (!unit?.id) return;
        setLoading(true);
        setDetailError(null); // Clear previous errors immediately

        try {
            const response = await apiService.patch(`/api/units/${unit.id}/`, formData);

            console.log("Update response:", response);
            
            if (response && response.id) {
                setIsEditing(false);
                router.refresh();
                close();
            } else {
                setDetailError(response.detail || "Failed to update unit.");
            }
        } catch (error: any) {
            const serverMessage = error.response?.detail || error.response?.status || "An unexpected error occurred.";
            setDetailError(serverMessage);
            console.error("Update failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSoftDelete = async () => {
        if (!unit?.id || !confirm("Are you sure you want to delete this unit?")) return;
        setLoading(true);
        try {
            await apiService.patch(`/api/units/${unit.id}/`, { is_active: false });
            router.refresh();
            close();
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className="">
            <TabHeader 
                currentTab={currentTab} 
                setCurrentTab={setCurrentTab} 
                hasTenant={tenants && tenants.length > 0}
                hasPendingCharges={hasPendingCharges}
             />
            
            <div className="p-4">
                {currentTab === 'details' && (
                    isEditing ? (
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                            {detailError && 
                                <p className="text-red-700 text-sm w-full bg-red-100 py-2 px-4 rounded-xl"><strong>Error:</strong> {detailError}</p>
                            }
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Unit Name</label>
                                <input 
                                    className="w-full p-2 border rounded" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Rent</label>
                                    <input 
                                        type="number"
                                        className="w-full p-2 border rounded" 
                                        value={formData.monthly_rent} 
                                        onChange={(e) => setFormData({...formData, monthly_rent: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Floor</label>
                                    <input 
                                        type="number"
                                        className="w-full p-2 border rounded" 
                                        value={formData.floor} 
                                        onChange={(e) => setFormData({...formData, floor: String(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                    <select 
                                        className="w-full p-2 border rounded" 
                                        value={formData.status} 
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="vacant">Vacant</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>
                            <button 
                                onClick={handleUpdate}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    ) : (
                        <DetailsTab 
                            unit={unit} 
                            tenants={tenants} 
                            loading={loading} 
                            onRemoveRoommate={handleRemoveRoommate} 
                            onRemoveTenancy={handleRemoveTenancy}
                            onAssignClick={() => setCurrentTab('tenant')} 
                        />
                    )
                )}
                {currentTab === 'tenant' && (
                    <TenantAssignmentForm 
                        unit={unit} 
                        tenancyId={tenancyId || undefined}
                        onSuccess={() => { fetchTenants(); setCurrentTab('details'); }} 
                        hasTenant={tenants && tenants.length > 0}
                    />
                )}
                {currentTab === 'payment' && <PaymentTab unit={unit} />}

                {currentTab === 'charges' && (
                    <ChargesTab
                        unit={unit} 
                        tenancyId={tenancyId} 
                        onPendingStatusChange={setHasPendingCharges}
                    />
                )}

                {currentTab === 'logs' && <LogsTab unit={unit} loading={loading} />}
            </div>
        </div>
    );

    return (
        <Modal
            label={`Unit ${unit?.name} Details`}
            isOpen={unitDetailModal.isOpen}
            close={unitDetailModal.close}
            content={content}
        />
    );
};

export default UnitDetailModal;

