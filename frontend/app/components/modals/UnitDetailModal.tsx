'use client';

import React, { useState, useEffect } from "react";
import useUnitDetailModal from "@/app/hooks/useUnitDetailModal";
import Modal from "./Modal";
import { Building2, Home, Save, UserPlus, History, UserCircle, ArrowRight, AlertTriangle } from "lucide-react";
import apiService from "@/app/services/apiService";
import { useRouter } from "next/navigation";

// Sub-components
import DetailsTab from "./tabs/DetailsTab";
import TenantAssignmentForm from "./tabs/TenantAssignmentForm";
import PaymentTab from "./tabs/PaymentTab";
import LogsTab from "./tabs/LogsTab";
import TabHeader from "./TabHeader";
import ChargesTab from "./tabs/ChargesTab";
import { ChargeType } from "./tabs/ChargesTab";
import ConfirmModal from "./ConfirmModal";

const UnitDetailModal = () => {
    const { property, unit, isOpen, close, isEditing: initialIsEditing } = useUnitDetailModal();
    const unitDetailModal = useUnitDetailModal();
    const [currentTab, setCurrentTab] = useState<'details' | 'tenant' | 'payment' | 'charges' | 'logs'>('details');
    const [tenants, setTenants] = useState<any[]>([]);
    const [tenancyId, setTenancyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [hasPendingCharges, setHasPendingCharges] = useState(false);
    const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        monthly_rent: 0,
        floor: '0',
        status: "vacant",
    });

    useEffect(() => {
        if (isOpen) {
            setCurrentTab('details');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!unit?.id) return;

        let isActive = true;

        const load = async () => {
            setLoading(true);
            try {
                const res = await apiService.get(`/api/tenants/unit/${unit.id}/`);

                if (!isActive) return;

                if (res && (res.tenants || Array.isArray(res))) {
                    const tenantData = res.tenants || (Array.isArray(res) ? res : []);
                    setTenants(tenantData);
                    setTenancyId(res.tenancy_id || null);
                } else {
                    setTenants([]);
                    setTenancyId(null);
                }
            } catch (error) {
                if (isActive) setTenants([]);
            } finally {
                if (isActive) setLoading(false);
            }
        };

        load();

        return () => {
            isActive = false;
        };
    }, [unit?.id]);

    const fetchChargeTypes = async () => {
        if (!unit?.id || unit.status !== 'occupied') return;
        try {
            const data = await apiService.get("/api/charge-types/");
            console.log("Fetched charge types:", data);
            setChargeTypes(Array.isArray(data.results) ? data.results : []);
        } catch (error) {
            console.error("Failed to fetch types", error);
            setChargeTypes([]);
        }
    };
    
    useEffect(() => {
        if (currentTab === 'charges') {
            fetchChargeTypes();
        }
    }, [currentTab]);

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

    const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);
    const handleRemoveTenancy = () => {
        setIsVacateModalOpen(true);
    };

    const confirmRemoveTenancy = async () => {
        setLoading(true);
        try {
            await apiService.post(`/api/units/${unit?.id}/vacate/`, {});
            setIsVacateModalOpen(false);
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
        setDetailError(null);

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

    const content = (
        <div className="">
            <ConfirmModal
                isOpen={isVacateModalOpen}
                icon={<AlertTriangle size={24} className="text-red-500" />}
                title="Terminate Lease?"
                message="This will end the lease and remove all tenants from this unit."
                message2="If you only want to remove one tenant, use the 'Remove Tenant' button on their card instead."
                confirmText="Terminate Lease"
                isLoading={loading}
                onConfirm={confirmRemoveTenancy}
                onClose={() => setIsVacateModalOpen(false)}
            />

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
                            property={property}
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
                        onSuccess={() => { setCurrentTab('details'); }} 
                        hasTenant={tenants && tenants.length > 0}
                    />
                )}
                {currentTab === 'payment' && <PaymentTab property={property} unit={unit} />}

                {currentTab === 'charges' && (
                    <ChargesTab
                        unit={unit} 
                        tenancyId={tenancyId} 
                        chargeTypes={chargeTypes}
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

