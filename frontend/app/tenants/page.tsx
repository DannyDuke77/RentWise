'use client';

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import apiService from "@/app/services/apiService";
import { use, useEffect, useState } from "react"
import { 
  Building, 
  MailIcon, 
  PhoneIcon, 
  UserIcon,
  IdCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  HistoryIcon,
  XCircleIcon 
} from "lucide-react";

export type TenantType = {
  id: string,
  full_name: string,
  phone: string,
  email: string | null,
  id_number: number | string,
  created_at: string,
  tenancies: {
    id: string;
    unit_name: string;
    is_active: boolean;
    start_date: string;
    end_date: string | null;
  }[],
}

const TenantsPage = () => {
    const [tenants, setTenants] = useState<TenantType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const getTenants = async (query?: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.get(`/api/tenants/${query ? `?q=${query}` : ''}`);
            setTenants(response.tenants || []);
        } catch (error) {
            if (error instanceof Error) setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        getTenants(searchTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        getTenants();
    };

    useEffect(() => {
        getTenants();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isActive = (tenant: TenantType) => tenant.tenancies?.some(t => t.is_active);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" label="Loading tenant directory..." />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tenant Directory</h1>
                <p className="mt-2 text-gray-600">Historical and active tracking of all residents</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total People</p>
                    <p className="text-3xl font-bold text-gray-900">{tenants.length}</p>
                </div>
                <div className="bg-white rounded-xl border p-5 shadow-sm border-l-4 border-l-green-500">
                    <p className="text-sm font-medium text-gray-500">Currently Renting</p>
                    <p className="text-3xl font-bold text-green-600">
                        {tenants.filter(t => isActive(t)).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border p-5 shadow-sm border-l-4 border-l-amber-500">
                    <p className="text-sm font-medium text-gray-500">Past Tenants</p>
                    <p className="text-3xl font-bold text-amber-600">
                        {tenants.filter(t => !isActive(t)).length}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="mb-6 flex gap-2">
                <div className="relative flex-1">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search by tenant name..."
                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                    Search
                </button>
                
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => handleClearSearch()}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </form>

            {tenants.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-20 text-center">
                    <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No tenants recorded in the system.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant) => (
                        <div key={tenant.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-xl font-bold text-gray-600 border">
                                            {tenant.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{tenant.full_name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {isActive(tenant) ? (
                                                    <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                        <CheckCircleIcon className="h-3 w-3 mr-1" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        <HistoryIcon className="h-3 w-3 mr-1" /> Inactive
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Member Since</p>
                                        <p className="text-sm font-medium text-gray-700">{formatDate(tenant.created_at)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="text-sm">{tenant.phone}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <IdCardIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="text-sm">{tenant.id_number}</span>
                                    </div>
                                    {tenant.email && (
                                        <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg col-span-2">
                                            <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className="text-sm">{tenant.email}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tenancy History Section */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Occupancy History</h4>
                                    <div className="space-y-2">
                                        {tenant.tenancies?.map((tcy) => (
                                            <div 
                                                key={tcy.id} 
                                                className={`flex items-center justify-between p-3 rounded-xl border ${
                                                    tcy.is_active ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Building className={`h-4 w-4 ${tcy.is_active ? 'text-blue-500' : 'text-gray-400'}`} />
                                                    <div>
                                                        <p className={`text-sm font-bold ${tcy.is_active ? 'text-blue-900' : 'text-gray-700'}`}>
                                                            Unit {tcy.unit_name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500">
                                                            {formatDate(tcy.start_date)} — {tcy.end_date ? formatDate(tcy.end_date) : 'Present'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {tcy.is_active ? (
                                                    <span className="text-[10px] font-black text-blue-600 uppercase italic">Current</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Moved Out</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TenantsPage;