'use client';

import { useState } from "react";
import useUnitModal from "@/app/hooks/useUnitModal";
import Modal from "./Modal"
import apiService from "@/app/services/apiService";
import { useRouter } from "next/navigation";
import { Building2, DollarSign, Layers, Home, Loader2, CheckCircle, Check } from "lucide-react";
import { PropertyType } from "@/app/properties/page";

export type UnitType = {
    property: PropertyType,
    id: string;
    unit: string;
    name: string;
    tenant_names?: any[];
    monthly_rent: number;
    status: 'occupied' | 'vacant' | 'maintenance';
    floor: string;
    is_active: 'active' | 'inactive';
    payments: any[];
}

const UnitModal = () => {
    const { propertyId, propertyName } = useUnitModal();
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [name, setName] = useState('');
    const [rent, setRent] = useState('');
    const [status, setStatus] = useState('vacant');
    const [floor, setFloor] = useState('');

    const router = useRouter();
    const unitModal = useUnitModal();

    const submitUnit = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('monthly_rent', rent);
            formData.append('status', status);
            formData.append('floor', floor);
            formData.append('is_active', 'true');

            if (propertyId) {
                formData.append('property', propertyId);
            }

            const response = await apiService.post(`/api/units/`, formData);

            if (response.id) {
                console.log('Unit added successfully');
                setSuccess(true);
                
                // Reset form after a brief delay
                setTimeout(() => {
                    unitModal.close();
                    router.refresh();
                    
                    // Reset form fields
                    setName('');
                    setRent('');
                    setStatus('vacant');
                    setFloor('');
                    setSuccess(false);
                }, 1500);
            } else {
                console.log('Error adding unit:', response);
                setErrors(response);
            }
        } catch (error) {
            console.error('Error adding unit:', error);
            setErrors({ general: ['An unexpected error occurred while adding the unit. Please try again.'] });
        } finally {
            setLoading(false);
        }
    }

    const errorStyle = 'border-2 border-red-500';

    const statusOptions = [
        { 
            value: 'vacant', 
            label: 'Vacant', 
            color: 'border-red-300 bg-red-50 data-[selected=true]:bg-red-100 data-[selected=true]:border-red-500', 
            iconColor: 'text-red-500'
        },
        { 
            value: 'occupied', 
            label: 'Occupied', 
            color: 'border-emerald-300 bg-emerald-50 data-[selected=true]:bg-emerald-100 data-[selected=true]:border-emerald-500',
            iconColor: 'text-emerald-500' 
        },
        { 
            value: 'maintenance', 
            label: 'Maintenance', 
            color: 'border-amber-300 bg-amber-50 data-[selected=true]:bg-amber-100 data-[selected=true]:border-amber-500',
            iconColor: 'text-amber-500' 
        }
    ];

    const content = (
        <div className="p-4 space-y-6">
            {/* Property Info */}
            {propertyName && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">{propertyName}</p>
                        <p className="text-xs text-blue-600">Adding new unit to this property</p>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200 animate-in slide-in-from-bottom-4">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                        <p className="font-medium text-emerald-800">Unit added successfully!</p>
                        <p className="text-sm text-emerald-600">Redirecting back to units list...</p>
                    </div>
                </div>
            )}

            {/* Form */}
            <form className="space-y-6">
                {/* Unit Name */}
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
                        <p className="text-sm text-red-600 -mt-1">
                            {errors.name[0]}
                        </p>
                    )}
                </div>

                {/* Rent and Floor Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Monthly Rent */}
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
                            <p className="text-sm text-red-600 -mt-1">
                                {errors.monthly_rent[0]}
                            </p>
                        )}
                    </div>

                    {/* Floor */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gray-500" />
                            <label className="block text-sm font-semibold text-gray-900">
                                Floor
                            </label>
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
                            <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-md">
                                {errors.floor[0]}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">
                        Unit Status
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {statusOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                data-selected={status === option.value}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${option.color} data-[selected=true]:shadow-sm`}
                                onClick={() => setStatus(option.value)}
                            >   
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                    {status === option.value && (
                                        <CheckCircle className={`w-4 h-4 stroke-[3] ${option.iconColor}`} />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                    {errors.status && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-md">
                            {errors.status[0]}
                        </p>
                    )}
                </div>

                {/* General Errors */}
                {errors.general && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700 font-medium">{errors.general[0]}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={submitUnit}
                    type="submit"
                    disabled={loading || success}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Adding Unit...
                        </>
                    ) : success ? (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Unit Added!
                        </>
                    ) : (
                        'Add New Unit'
                    )}
                </button>
            </form>

            {/* Help Text */}
            <div className="text-center">
                <p className="text-sm text-gray-500">
                    This unit will be added to <span className="font-semibold text-gray-900 border-b-3 border-gray-900">{propertyName}</span>
                </p>
            </div>
        </div>
    );

    return (
        <Modal 
            label="Add New Unit"
            isOpen={unitModal.isOpen}
            close={unitModal.close}
            content={content}
        />
    )
}

export default UnitModal;