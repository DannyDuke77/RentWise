'use client';

import { useState } from "react";
import Link from "next/link";
import {
    Receipt, X, Building2, Home, CheckCircle2,
    Clock, Minus, Settings, Info
} from "lucide-react";
import { useChargeStats } from "@/app/hooks/queries/useChargeQueries";
import { useCharges } from "@/app/hooks/queries/useChargeQueries";
import { useDebounce } from "@/app/hooks/useDebounce";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Pagination from "@/app/components/ui/Pagination";
import { SearchInput } from "@/app/components/ui/SearchInput";
import { Charge } from "@/app/src/types/Types";
import RefreshButton from "@/app/components/ui/RefreshButton";
import ChargesPageSkeleton from "@/app/components/skeletons/ChargesPageSkeleton";
import TableSkeleton from "@/app/components/skeletons/TableSkeleton";
import StatCard from "@/app/components/ui/StatCard";
import { stat } from "fs";

const ChargesPage = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [unitFilter, setUnitFilter] = useState("");

    const debouncedSearch = useDebounce(searchTerm, 500);
    const effectiveSearch = debouncedSearch.trim();

    const { data: chargesData, isPending, isFetching, refetch } = useCharges(
        page,
        pageSize,
        effectiveSearch,
        statusFilter,
        unitFilter
    );

    const { data: statsData, isPending: statsPending } = useChargeStats();

    const charges: Charge[] = chargesData?.results ?? [];
    const totalCount = chargesData?.count ?? 0;

    const handleFilterChange = (setter: Function, value: any) => {
        setter(value);
        setPage(1);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setUnitFilter("");
        setPage(1);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'paid':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'waived':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-3.5 h-3.5" />;
            case 'paid':
                return <CheckCircle2 className="w-3.5 h-3.5" />;
            case 'waived':
                return <Minus className="w-3.5 h-3.5" />;
            default:
                return null;
        }
    };

    if (isPending) return <ChargesPageSkeleton />;

    return (
        <div className="max-w-8xl space-y-8 mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="">
                                <Receipt className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                    Charges
                                </h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Track and manage all property charges
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Total Records Badge */}
                        <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 rounded-full border border-gray-200">
                            <Receipt className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">
                                {totalCount} {totalCount === 1 ? 'charge' : 'charges'}
                            </span>
                        </div>

                        {/* Action Links */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 text-sm rounded-full border border-blue-100">
                            <Link 
                                href="/landlord-portal/settings?tab=charges" 
                                className="flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Manage Types
                            </Link>
                            <span className="text-blue-300">|</span>
                            <Link 
                                href="/properties" 
                                className="flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                            >
                                <Home className="w-3.5 h-3.5" />
                                Apply to Units
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Help */}
                <div className="mt-4 flex flex-wrap items-center gap-4 p-3 bg-amber-50/50 border border-amber-200/50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-amber-700">
                        <Info className="w-3.5 h-3.5" />
                        <span>Charges are created per unit. Define charge types in </span>
                        <Link 
                            href="/landlord-portal/settings?tab=charges" 
                            className="font-medium text-blue-600 hover:underline"
                        >
                            Settings
                        </Link>
                        <span>and apply them to units from the unit view.</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Charges"
                    value={statsData?.total_charges}
                    icon={Receipt}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    ring="ring-blue-500/10"
                    isPending={statsPending}
                />

                <StatCard 
                    title="Pending Charges"
                    value={statsData?.pending}
                    icon={Clock}
                    color="text-rose-500"
                    bg="bg-rose-50"
                    ring="ring-rose-500/10"
                    isPending={statsPending}
                />

                <StatCard 
                    title="Paid Charges"
                    value={statsData?.paid}
                    icon={CheckCircle2}
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                    ring="ring-emerald-500/10"
                    isPending={statsPending}
                />

                <StatCard 
                    title="Waived Charges"
                    value={statsData?.waived}
                    icon={Minus}    
                    color="text-gray-500"
                    bg="bg-gray-50"
                    ring="ring-gray-500/10"
                    isPending={statsPending}
                />
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">All Charges</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Showing {charges.length} of {totalCount} charges
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <SearchInput 
                            onSearchChange={(value) => handleFilterChange(setSearchTerm, value)}
                        />

                        <select
                            className="px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            value={statusFilter}
                            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="waived">Waived</option>
                        </select>

                        <RefreshButton isFetching={isFetching} refetch={refetch} />

                        {(searchTerm || statusFilter || unitFilter) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200">
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Building2 className="w-4 h-4 mr-2" />
                                        Property / Unit
                                    </div>
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Charge Type
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Amount (KES)
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isFetching ? (
                                <tr>
                                    <td colSpan={7} className="">
                                        <TableSkeleton rows={charges.length} cols={7} rowSize="h-8" headerVisible={false} />
                                    </td>
                                </tr>
                            ) : charges.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Receipt className="w-12 h-12 text-gray-300" />
                                            <p className="font-medium">No charges found</p>
                                            <p className="text-sm text-gray-400">
                                                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first charge'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                charges.map((charge: Charge) => (
                                    <tr key={charge.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <div>
                                                <p className="font-medium text-gray-900">{charge.unit.name}</p>
                                                <p className="text-sm text-gray-500">{charge.property.name}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <span className="font-medium text-gray-900">{charge.charge_type_name}</span>
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <span className="font-bold text-gray-900 text-lg">
                                                KES {charge.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm text-gray-600 max-w-xs truncate">
                                                {charge.description || <span className="text-gray-400 italic">No description</span>}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(charge.status)}`}>
                                                {getStatusIcon(charge.status)}
                                                {charge.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {new Date(charge.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(charge.created_at).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Link
                                                href={`/properties/${charge.property.id}/units/${charge.unit.id}?tab=charges`}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />
            </div>
        </div>
    );
};

export default ChargesPage;