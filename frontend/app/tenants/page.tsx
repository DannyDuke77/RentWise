'use client';

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import apiService from "@/app/services/apiService";
import { useEffect, useState } from "react"
import { UnitType } from "../components/modals/UnitModal";
import { 
  Building, 
  MailIcon, 
  PhoneIcon, 
  UserIcon,
  IdCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon 
} from "lucide-react";

export type TenantType = {
  id: string,
  full_name: string,
  phone: string,
  email: string | null,
  id_number: number | string,
  created_at: string,
  left_at: string | '',
  units: UnitType[],
  is_active: boolean,
}

const TenantsPage = () => {
    const [tenants, setTenants] = useState<TenantType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTenants = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.get('/api/tenants/');

            if (response.success) {
                setTenants(response.tenants || []);
            } else {
                setTenants([]);
                setError('Failed to load tenants');
            }
        } catch (error) {
            if (error instanceof Error) setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getTenants();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" label="Loading tenants..." />
        </div>
    );

    if (error) return (
        <div className="max-w-4xl mt-24 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Tenants</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={getTenants}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
                <p className="mt-2 text-gray-600">Manage all tenants across your properties</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                            <p className="text-2xl font-semibold text-gray-900">{tenants.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-green-100 text-green-900 rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <UserIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium">Active</p>
                            <p className="text-2xl font-semibold">{tenants.filter(t => !t.left_at).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-red-100 text-red-900 rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <UserIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium">Inactive</p>
                            <p className="text-2xl font-semibold">{tenants.filter(t => t.left_at).length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Building className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Occupied Units</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {/* Count of unique units assigned to tenants */}
                                {Array.from(new Set(tenants.flatMap(t => t.units.map(u => u.id)))).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {tenants.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <UserIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tenants Found</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                        You haven't added any tenants yet. Add your first tenant to get started.
                    </p>
                    <button
                        onClick={getTenants}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                    >
                        Refresh List
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant: TenantType) => (
                        <div key={tenant.id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                            {/* Tenant Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-lg">{tenant.full_name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="font-semibold text-gray-900">{tenant.full_name}</h3>
                                        <div className="flex items-center mt-1">
                                            {tenant.is_active ? (
                                                <>
                                                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                                                    <span className="text-xs text-green-600 font-medium">Active Tenant</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                                                    <span className="text-xs text-red-600 font-medium">Inactive Tenant</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                    ID: {tenant.id.slice(0, 8)}...
                                </span>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-gray-600">
                                    <MailIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-sm">{tenant.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-sm">{tenant.phone}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <IdCardIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-sm">ID: {tenant.id_number}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-sm">Since {formatDate(tenant.created_at)}</span>
                                </div>
                                {tenant.left_at && (
                                    <div className="flex items-center text-gray-600">
                                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-sm">Left {formatDate(tenant.left_at)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Assigned Units */}
                            <div className="border-t pt-4">
                                <div className="flex items-center mb-2">
                                    <Building className="h-5 w-5 text-gray-400 mr-2" />
                                    <h4 className="text-sm font-medium text-gray-700">Assigned Units</h4>
                                </div>
                                {tenant.units?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {tenant.units.map((unit: UnitType) => (
                                      <span
                                        key={unit.id}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"
                                      >
                                        {unit.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">No units assigned</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TenantsPage;
