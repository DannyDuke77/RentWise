'use client';

import { useState, useEffect } from "react";
import useUnitModal from "@/app/hooks/useUnitModal";
import Modal from "../ui/Modal";
import { Building2, DollarSign, Layers, Home, Loader2, CheckCircle, Check, Ban, Info } from "lucide-react";
import { useCreateUnit, useUpdateUnit } from "@/app/hooks/mutations/useUnitMutations";
import { useToast } from "@/app/providers/ToastProvider";

const UnitModal = () => {
    const { property, unit, isEditing, isOpen } = useUnitModal();
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [rent, setRent] = useState('');
    const [status, setStatus] = useState('vacant');
    const [floor, setFloor] = useState('');

    const unitModal = useUnitModal();
    const createUnitMutation = useCreateUnit();
    const updateUnitMutation = useUpdateUnit();

    useEffect(() => {
        if (isOpen) {
            if (isEditing && unit) {
                setName(unit.name || '');
                setRent(String(unit.monthly_rent) || '');
                setStatus(unit.status || 'vacant');
                setFloor(String(unit.floor) || '');
            } else {
                setName('');
                setRent('');
                setStatus('vacant');
                setFloor('');
            }
            setErrors({});
        }
    }, [isOpen, isEditing, unit]);

    // Get allowed status transitions with reasons
    const getAllowedStatuses = () => {
        if (!isEditing || !unit) {
            // Creating new unit - only vacant and maintenance allowed
            return {
                vacant: { allowed: true, reason: '' },
                occupied: { allowed: false, reason: 'Use "Assign Tenant" action to mark as occupied' },
                maintenance: { allowed: true, reason: '' },
            };
        }

        const currentStatus = unit.status;
        const statuses: Record<string, { allowed: boolean; reason: string }> = {};

        switch (currentStatus) {
            case 'vacant':
                statuses.vacant = { allowed: true, reason: '' };
                statuses.occupied = { allowed: false, reason: 'Use "Assign Tenant" action to process move-in' };
                statuses.maintenance = { allowed: true, reason: '' };
                break;

            case 'occupied':
                statuses.vacant = { allowed: false, reason: 'Use "Vacate Unit" action to process move-out' };
                statuses.occupied = { allowed: true, reason: '' };
                statuses.maintenance = { allowed: false, reason: 'Cannot place occupied unit under maintenance' };
                break;

            case 'maintenance':
                statuses.vacant = { allowed: true, reason: '' };
                statuses.occupied = { allowed: false, reason: 'Use "Assign Tenant" action to process move-in' };
                statuses.maintenance = { allowed: true, reason: '' };
                break;

            default:
                statuses.vacant = { allowed: true, reason: '' };
                statuses.occupied = { allowed: false, reason: '' };
                statuses.maintenance = { allowed: true, reason: '' };
        }

        return statuses;
    };

    const hasChanges = () => {
        if (!isEditing || !unit) {
            return name.trim() !== "" && rent.trim() !== "";
        }

        return (
            name !== (unit.name ?? "") ||
            rent !== String(unit.monthly_rent ?? "") ||
            status !== (unit.status ?? "vacant") ||
            floor !== String(unit.floor ?? "")
        );
    };

    const submitUnit = async (e: React.MouseEvent) => {
        e.preventDefault();
        setErrors({});

        if (!property?.id) {
            setErrors({ general: ['Property information is missing. Please close and reopen the unit.'] });
            return;
        }

        if (name.trim() === "" || rent.trim() === "") {
            showToast('Missing Information', 'Please fill in all required fields.', 'error');
            setErrors({
                ...(name.trim() === "" && { name: ['Unit name is required'] }),
                ...(rent.trim() === "" && { monthly_rent: ['Monthly rent is required'] }),
            });
            return;
        }

        if (isEditing && !hasChanges()) {
            showToast('No Changes', 'No changes were made to the unit.', 'warning');
            return;
        }

        const allowedStatuses = getAllowedStatuses();
        if (!allowedStatuses[status]?.allowed) {
            setErrors({
                status: [allowedStatuses[status]?.reason || 'Status change not allowed']
            });
            return;
        }

        const payload = {
            name,
            monthly_rent: rent,
            status,
            floor,
            is_active: true,
            property: property.id
        };

        try {
            if (isEditing && unit?.id) {
                const response = await updateUnitMutation.mutateAsync({
                    unitId: unit.id,
                    propertyId: property.id,
                    payload: payload
                });

                if (response.success) {
                    unitModal.close();
                    showToast('Unit Updated!', 'Your unit has been updated successfully.', 'success');
                } else {
                    setErrors(response?.errors || response);
                }
            } else {
                const response = await createUnitMutation.mutateAsync({ 
                    propertyId: property.id, 
                    payload  
                });

                if (response?.id) {
                    unitModal.close();
                    showToast('Unit Created!', 'Your unit has been created successfully.', 'success');
                } else {
                    showToast('Failed to create', 'An unexpected error occurred. Please try again.', 'error');
                    console.error('Failed to create unit:', response);
                    setErrors({
                        general: ['An unexpected error occurred. Please try again.']
                    });
                }
            }
        } catch (error: any) {
            console.error('Error submitting unit:', error);
            const serverErrors = error.response?.data?.errors || 
                error.response?.data || 
                { general: ['An unexpected error occurred. Please try again.'] };
            setErrors(serverErrors);
        }
    };

    const errorStyle = 'border-2 border-red-500';

    // Get allowed statuses for rendering
    const allowedStatuses = getAllowedStatuses();

    const statusOptions = [
        { 
            value: 'vacant', 
            label: 'Vacant', 
            color: 'border-gray-300 bg-gray-100 data-[selected=true]:bg-red-100 data-[selected=true]:border-red-500', 
            iconColor: 'text-red-500',
        },
        { 
            value: 'occupied', 
            label: 'Occupied', 
            color: 'border-gray-300 bg-gray-100 data-[selected=true]:bg-emerald-100 data-[selected=true]:border-emerald-500',
            iconColor: 'text-emerald-500',
        },
        { 
            value: 'maintenance', 
            label: 'Maintenance', 
            color: 'border-gray-300 bg-gray-100 data-[selected=true]:bg-amber-100 data-[selected=true]:border-amber-500',
            iconColor: 'text-amber-500',
        }
    ];

    const content = (
        <div className="p-4 space-y-6">
            {property?.name && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">{property.name}</p>
                        <p className="text-xs text-blue-600">{isEditing ? `Editing ${unit?.name || ''}` : 'Adding New Unit'}</p>
                    </div>
                </div>
            )}

            {errors.general && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-sm text-red-800 font-medium">{errors.general}</p>
                </div>
            )}

            <form className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-500" />
                        <label className="block text-sm font-semibold text-gray-900">
                            Unit Name / Number
                        </label>
                    </div>
                    <input
                        type="text"
                        className={`w-full uppercase px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-400 text-gray-900 ${errors.name ? errorStyle : ''}`}
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                        placeholder="e.g., A101, Suite 202"
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600 -mt-1">{errors.name[0]}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <label className="block text-sm font-semibold text-gray-900">
                                Monthly Rent
                            </label>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                className={`w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-400 text-gray-900 ${errors.monthly_rent ? errorStyle : ''}`}
                                value={rent}
                                onChange={(e) => setRent(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        {errors.monthly_rent && (
                            <p className="text-sm text-red-600 -mt-1">{errors.monthly_rent[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gray-500" />
                            <label className="block text-sm font-semibold text-gray-900">Floor</label>
                        </div>
                        <input
                            type="number"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-400 text-gray-900"
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            placeholder="e.g., 0, 1, 2, 3"
                            min="0"
                        />
                        {errors.floor && (
                            <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-md">{errors.floor[0]}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">Unit Status</label>
                    <div className="grid grid-cols-3 gap-3">
                        {statusOptions.map((option) => {
                            const isAllowed = allowedStatuses[option.value]?.allowed ?? true;
                            const reason = allowedStatuses[option.value]?.reason || '';
                            const isSelected = status === option.value;
                            
                            return (
                                <div key={option.value} className="relative group">
                                    <button
                                        type="button"
                                        data-selected={isSelected}
                                        disabled={!isAllowed}
                                        className={`
                                            w-full flex flex-col items-center justify-center p-4 rounded-xl border-2 
                                            transition-all duration-200 
                                            ${option.color} 
                                            data-[selected=true]:shadow-sm
                                            ${!isAllowed ? 'opacity-50 cursor-not-allowed hover:scale-100 border-gray-200 bg-gray-50' : 'hover:scale-105'}
                                            relative
                                        `}
                                        onClick={() => isAllowed && setStatus(option.value)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                            {isSelected && (
                                                <Check className={`w-5 h-5 stroke-[3] ${option.iconColor}`} />
                                            )}
                                            {!isAllowed && (
                                                <Ban className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </button>
                                    
                                    {/* Tooltip showing why disabled */}
                                    {!isAllowed && reason && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-lg">
                                            {reason}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {errors.status && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-700 text-sm font-medium">{errors.status[0]}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={submitUnit}
                    type="submit"
                    disabled={updateUnitMutation.isPending}
                    title={isEditing && !hasChanges() ? 'No changes made.' : ''}
                    className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {(updateUnitMutation.isPending) ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isEditing ? 'Updating Unit...' : 'Adding Unit...'}
                        </>
                    ) :  (
                        isEditing ? 'Save Changes' : 'Add New Unit'
                    )}
                </button>
            </form>

            <div className="text-center">
                {isEditing ? 
                    <p className="text-sm text-gray-500">Changes will be applied to <span className="font-semibold text-gray-900 border-b-3 border-gray-900">{unit?.name}</span></p>
                :
                    <p className="text-sm text-gray-500">This unit will be added to <span className="font-semibold text-gray-900 border-b-3 border-gray-900">{property?.name}</span></p>
                }
            </div>
        </div>
    );

    return (
        <Modal 
            label={isEditing ? `Editing Unit ${unit?.name || ''}`.trim() : 'Add New Unit'}
            isOpen={unitModal.isOpen}
            close={unitModal.close}
            content={content}
            maxWidth="max-w-3xl"
        />
    );
};

export default UnitModal;