'use client';

import apiService from "@/app/services/apiService";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  Type, 
  FileText, 
  Home, 
  ArrowLeft, 
  Loader2, 
  Plus, 
  ChevronDown,
  Globe,
  Building,
  Hotel,
  House,
  Castle,
  Store
} from "lucide-react";

type PropertyType = {
    value: string;
    label: string;
};


const AddPropertyPage = () => {
    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [name, setName] = useState('');
    const [propertyType, setPropertyType] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [selectedTypeLabel, setSelectedTypeLabel] = useState('Select property type');

    const router = useRouter();

    useEffect(() => {
        apiService.get('/api/properties/types/')
            .then(response => {
                setPropertyTypes(response);
            })
            .catch(error => {
                console.log('Error fetching property types:', error);
            });
    }, []);

    useEffect(() => {
        if (propertyType) {
            const selected = propertyTypes.find(type => type.value === propertyType);
            setSelectedTypeLabel(selected ? selected.label : 'Select property type');
        } else {
            setSelectedTypeLabel('Select property type');
        }
    }, [propertyType, propertyTypes]);

    const submitProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('property_type', propertyType);
            formData.append('location', location);
            formData.append('description', description);
            formData.append('is_active', 'true');

            const response = await apiService.post('/api/properties/', formData);

            if (response.id) {
                console.log('Property added successfully');
                router.push(`/properties/${response.id}`);
            } else {
                console.log('Error adding property:', response);
                setErrors(response);
            }
        } catch (error) {
            console.error('Error adding property:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Properties
                </button>
                
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Add New Property</h1>
                        <p className="text-gray-600 mt-1 text-sm md:text-base">
                            Create a new property listing to start managing units and tenants
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Form Header */}
                <div className="px-6 md:px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Property Information</h2>
                            <p className="text-sm text-gray-500">Fill in all the required details below</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submitProperty} className="px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
                    {/* Property Name */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Home className="w-5 h-5 text-blue-600" />
                            <label className="text-sm font-semibold text-gray-900">
                                Property Name <span className="text-red-600">*</span>
                            </label>
                        </div>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="e.g., Downtown Luxury Apartments, Hillside Villas"
                            className={`w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-3 focus:ring-blue-200 transition-all placeholder:text-gray-400 text-gray-900 ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && (
                            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm font-medium">{errors.name[0]}</p>
                            </div>
                        )}
                    </div>

                    {/* Property Type & Location Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Property Type - Fixed version */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Type className="w-5 h-5 text-blue-600" />
                                <label className="text-sm font-semibold text-gray-900">
                                    Property Type <span className="text-red-600">*</span>
                                </label>
                            </div>
                            
                            {/* Custom styled select wrapper */}
                            <div className="relative">
                                <select
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                    className={`w-full px-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-3 focus:ring-blue-200 transition-all text-gray-900 cursor-pointer ${errors.property_type ? 'border-red-500' : ''}`}
                                >
                                    <option value="" className="text-gray-400">
                                        Select property type
                                    </option>
                                    {propertyTypes.map((type: PropertyType) => (
                                        <option key={type.value} value={type.value} className="text-gray-900">
                                            {type.label}
                                        </option>
                                    ))}
                                </select>                                
                            </div>
                            
                            {errors.property_type && (
                                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm font-medium">{errors.property_type[0]}</p>
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <label className="text-sm font-semibold text-gray-900">
                                    Location <span className="text-red-600">*</span>
                                </label>
                            </div>
                            <input 
                                type="text" 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                                placeholder="e.g., 123 Main St, New York, NY 10001"
                                className={`w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-3 focus:ring-blue-200 transition-all placeholder:text-gray-400 text-gray-900 ${errors.location ? 'border-2 border-red-500' : ''}`}
                            />
                            {errors.location && (
                                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm font-medium">{errors.location[0]}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <label className="text-sm font-semibold text-gray-900">
                                Description
                            </label>
                        </div>
                        <div className="relative">
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Describe the property features, amenities, nearby facilities, etc."
                                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-3 focus:ring-blue-200 transition-all placeholder:text-gray-400 text-gray-900 min-h-[140px] resize-none"
                                rows={4}
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                {description.length}/500
                            </div>
                        </div>
                        {errors.description && (
                            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm font-medium">{errors.description[0]}</p>
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <button 
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium rounded-xl border border-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Adding Property...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Add Property
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Tips Section */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Tips for adding a property</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                                Be specific with property names for easy identification
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                                Use a clear and descriptive location
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                                You can add units and upload photos after creating the property
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddPropertyPage;