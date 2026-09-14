"use client";

import { useState, useEffect, useRef } from "react";
import usePropertyModal from "@/app/hooks/usePropertyModal";
import Modal from "../ui/Modal";
import { 
    Building2, Home, Loader2, Plus, Type, 
    MapPin, FileText, AlertCircle, Lightbulb,
    ChevronDown,
} from "lucide-react";
import { useCreateProperty, useUpdateProperty } from "@/app/hooks/mutations/usePropertyMutations";
import { useToast } from "@/app/providers/ToastProvider";

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'other', label: 'Other' },
] as const;

const PropertyModal = () => {
    const { property, isEditing, isOpen } = usePropertyModal();
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);

    const isSubmitting = useRef(false);

    const [name, setName] = useState('');
    const [selectedPropertyType, setSelectedPropertyType] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    const propertyModal = usePropertyModal();
    const createPropertyMutation = useCreateProperty();
    const updatePropertyMutation = useUpdateProperty();

    const { showToast } = useToast();

    // ✅ Helper to clear a specific error
    const clearError = (field: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    useEffect(() => {
        if (isOpen) {
            if (isEditing && property) {
                setName(property.name || '');
                setSelectedPropertyType(property.property_type || '');
                setLocation(property.location || '');
                setDescription(property.description || '');
            } else {
                setName('');
                setSelectedPropertyType('');
                setLocation('');
                setDescription('');
            }
            setErrors({});
            setSuccess(false);
        }
    }, [isOpen, isEditing, property]);

    const hasChanges = () => {
        if (!isEditing || !property) {
            return name.trim() !== "" && location.trim() !== "";
        }
        
        return (
            name !== (property.name ?? "") ||
            selectedPropertyType !== (property.property_type ?? "") ||
            location !== (property.location ?? "") ||
            description !== (property.description ?? "")
        );
    };

    const submitProperty = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isSubmitting.current) return;

        setErrors({});
        setSuccess(false);
        
        if (name.trim() === "" || selectedPropertyType === "" || location.trim() === "") {
            showToast('Missing Information', 'Please fill in all required fields.', 'error');
            setErrors({
                ...(name.trim() === "" && { name: ['Property name is required'] }),
                ...(selectedPropertyType === "" && { property_type: ['Property type is required'] }),
                ...(location.trim() === "" && { location: ['Property location is required'] }),
            });
            return;
        }

        if (isEditing && !hasChanges()) {
            showToast('No Changes', 'No changes were made to the property.', 'warning');
            return;
        }

        isSubmitting.current = true;

        const payload = {
            name: name.trim(),
            property_type: selectedPropertyType,
            location: location.trim(),
            description: description.trim(),
            is_active: true,
        };

        try {
            if (isEditing && property?.id) {
                if (!property?.id) {
                    setErrors({
                        general: ['Property information is missing. Please close and reopen the property.']
                    });
                    return;
                }

                const response = await updatePropertyMutation.mutateAsync({
                    propertyId: property.id,
                    payload: payload
                });

                if (response.id || response.status === 200) {
                    showToast('Property Updated!', 'Your property has been saved successfully.', 'success');
                    propertyModal.close();
                } else {
                    showToast('Failed to update', 'Please check the form for errors.', 'error');
                    setErrors(response);
                }
            } else {
                const formData = new FormData();
                Object.entries(payload).forEach(([key, val]) => {
                    formData.append(key, String(val));
                });

                const response = await createPropertyMutation.mutateAsync(formData);

                if (response.id) {
                    showToast('Property Created!', 'Your property has been created successfully.', 'success');
                    propertyModal.close();
                } else {
                    showToast('Failed to create', 'Please check the form for errors.', 'error');
                    setErrors(response);
                }
            }
        } catch (error: any) {
            console.error('Error submitting property:', error);
            const serverErrors = error.response?.data || { general: ['An unexpected error occurred. Please try again.'] };
            setErrors(serverErrors);
        } finally {
            isSubmitting.current = false;
        }
    };

    const content = (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                    {isEditing ? 'Edit Property' : 'Add New Property'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {isEditing 
                        ? 'Update your property information' 
                        : 'Create a new property to start managing units and tenants'
                    }
                </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                {/* General Error */}
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Error</p>
                                <p className="text-sm text-red-700">{errors.general[0]}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Property Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Property Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => {
                                setName(e.target.value);
                                clearError('name');
                            }}
                            placeholder="e.g., Downtown Luxury Apartments"
                            className={`w-full pl-9 pr-3 py-2.5 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                        />
                    </div>
                    {errors.name && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600">{errors.name[0]}</p>
                        </div>
                    )}
                </div>

                {/* Property Type & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                            Property Type <span className="text-red-500">*</span>
                        </label>
                        
                        <div className="relative">
                            <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                            <select
                            value={selectedPropertyType}
                            onChange={(e) => {
                                setSelectedPropertyType(e.target.value);
                                clearError('property_type');
                            }}
                            className={`
                                w-full pl-10 pr-10 py-2.5 border-2 rounded-lg text-sm text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-400 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer
                                ${errors.property_type ? 'border-red-300 focus:ring-red-100 focus:border-red-500' : 'border-gray-300'}
                            `}
                            >
                            <option value="" className="text-gray-400">Select a property type</option>
                            {PROPERTY_TYPES.map((type: { value: string; label: string }) => (
                                <option key={type.value} value={type.value} className="py-1">
                                {type.label}
                                </option>
                            ))}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform group-hover:rotate-180" />
                        </div>
  
                        {errors.property_type && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-600">{errors.property_type[0]}</p>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                value={location} 
                                onChange={(e) => {
                                    setLocation(e.target.value);
                                    clearError('location');
                                }}
                                placeholder="e.g., 123 Main St, New York, NY"
                                className={`w-full pl-9 pr-3 py-2.5 border ${errors.location ? 'border-red-300' : 'border-gray-300'} rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                            />
                        </div>
                        {errors.location && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-600">{errors.location[0]}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Describe the property features, amenities, nearby facilities..."
                            className={`w-full pl-9 pr-3 py-2.5 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition min-h-[100px] resize-none`}
                            rows={4}
                            maxLength={500}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                            {description.length}/500
                        </div>
                    </div>
                    {errors.description && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.description[0]}</p>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200">
                    <button 
                        type="button"
                        onClick={propertyModal.close}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    
                    <button 
                        type="submit" 
                        onClick={submitProperty}
                        disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}
                        className="flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {updatePropertyMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {isEditing ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                {isEditing ? 'Update Property' : 'Create Property'}
                            </>
                        )}
                    </button>
                </div>

                {/* Tips Section */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="flex items-center gap-1 text-sm font-semibold text-blue-800 uppercase tracking-wider mb-2">
                        <Lightbulb className="w-5 h-5 stroke-2 text-yellow-500" />
                        Pro Tips
                    </h4>
                    <ul className="space-y-1.5 text-sm text-blue-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            Use a specific property name for easy identification
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            Include a clear and descriptive location
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            You can add units after creating the property
                        </li>
                    </ul>
                </div>
            </form>
        </div>
    );

    return (
        <Modal 
            label={isEditing ? "Edit Property" : "Add New Property"} 
            isOpen={propertyModal.isOpen} 
            close={propertyModal.close} 
            content={content}
            maxWidth="max-w-4xl"
        />
    );
};

export default PropertyModal;