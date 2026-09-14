'use client';

import { useState } from 'react';
import { 
    History, 
    Search, 
    X, 
    RefreshCcw, 
    Clock, 
    User, 
    Calendar, 
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    Minus,
    Filter,
    ChevronDown,
    ArrowRight,
    ArrowDownRight,
    AlertCircle,
    CheckCircle2,
    Hash,
    Tag,
    Layers
} from 'lucide-react';
import { useChangeLogs } from '@/app/hooks/queries/useChangeLogQueries';
import { useDebounce } from '@/app/hooks/useDebounce';
import Pagination from '@/app/components/ui/Pagination';
import RefreshButton from '../../ui/RefreshButton';
import { useBusiness } from '@/app/providers/BusinessProvider';

interface ChangeLogTableProps {
    unitId?: string;
    propertyId?: string;
}

// Field name mapping with icons and colors
const FIELD_METADATA: Record<string, { icon: any; color: string; label: string }> = {
    name: { icon: Tag, color: 'text-blue-500', label: 'Name' },
    status: { icon: AlertCircle, color: 'text-amber-500', label: 'Status' },
    monthly_rent: { icon: Hash, color: 'text-emerald-500', label: 'Monthly Rent' },
    floor: { icon: Layers, color: 'text-purple-500', label: 'Floor' },
    property: { icon: FileText, color: 'text-indigo-500', label: 'Property' },
    description: { icon: FileText, color: 'text-teal-500', label: 'Description' },
    location: { icon: FileText, color: 'text-cyan-500', label: 'Location' },
};

const LogsTab = ({ unitId }: ChangeLogTableProps) => {
    const { activeBusinessRole } = useBusiness();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [fieldFilter, setFieldFilter] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const effectiveSearch = debouncedSearch.trim();

    const { data, isFetching, refetch } = useChangeLogs(
        page,
        pageSize,
        unitId,
        fieldFilter,
        effectiveSearch
    );

    const logs = data?.results ?? [];
    const totalCount = data?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const getUserTypeColor = (type: string | null) => {
        switch (type) {
            case 'staff': return 'bg-blue-500/10 text-blue-700 border-blue-200/50';
            case 'owner': return 'bg-purple-500/10 text-purple-700 border-purple-200/50';
            case 'manager': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-200/50';
        }
    };

    const getUserTypeBadge = (type: string | null) => {
        const colors = getUserTypeColor(type);
        const labels = {
            staff: 'Staff',
            owner: 'Owner',
            manager: 'Manager',
        };
        return labels[type as keyof typeof labels] || 'User';
    };

    const getChangeType = (oldVal: string | null, newVal: string | null) => {
        if (!oldVal && newVal) return { icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Added' };
        if (oldVal && !newVal) return { icon: ArrowDownLeft, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Removed' };
        if (oldVal && newVal && oldVal !== newVal) return { icon: ArrowRight, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Changed' };
        return { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-100', label: 'No Change' };
    };

    const formatValue = (value: string | null) => {
        if (!value) return '—';
        if (value === 'true' || value === 'false') {
            return value === 'true' ? 'Yes' : 'No';
        }
        return value;
    };

    const getFieldMetadata = (fieldName: string) => {
        return FIELD_METADATA[fieldName] || { 
            icon: FileText, 
            color: 'text-gray-500', 
            label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1) 
        };
    };

    const formatDate = (date: string) => {
        const d = new Date(date);

        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFieldFilter('');
        setPage(1);
    };

    const isFiltered = searchTerm || fieldFilter;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-blue-50/30 to-white p-6 rounded-2xl border border-blue-100/50 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25">
                        <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Activity Log
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200/50">
                                Live
                            </span>
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Track all changes made to this unit in real-time
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                            {totalCount.toLocaleString()} <span className="text-gray-400 font-normal">changes</span>
                        </span>
                    </div>
                    <RefreshButton isFetching={isFetching} refetch={refetch} />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by field, user, or value..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="relative">
                    <select
                        className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white appearance-none min-w-[160px] cursor-pointer"
                        value={fieldFilter}
                        onChange={(e) => setFieldFilter(e.target.value)}
                    >
                        <option value="">All Fields</option>
                        <option value="name">Name</option>
                        <option value="status">Status</option>
                        <option value="monthly_rent">Monthly Rent</option>
                        <option value="floor">Floor</option>
                        <option value="property">Property</option>
                        <option value="description">Description</option>
                        <option value="location">Location</option>
                    </select>
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                {isFiltered && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                    >
                        <X className="w-4 h-4" />
                        Clear Filters
                    </button>
                )}
                
                {isFiltered && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="text-xs font-medium text-blue-700">
                            {logs.length} result{logs.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>
            
            {/* Table */}
            <div>
                {isFetching ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-blue-100 rounded-full animate-spin border-t-blue-500"></div>
                            </div>
                            <p className="text-sm text-gray-500">Loading change logs...</p>
                        </div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="p-6 bg-white rounded-full shadow-lg shadow-gray-100 mb-6">
                            <History className="w-12 h-12 text-gray-300" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700">No changes recorded</h4>
                        <p className="text-sm text-gray-400 mt-1 max-w-sm text-center">
                            {isFiltered 
                                ? 'No results match your current filters. Try adjusting your search criteria.'
                                : 'Changes to this unit will appear here as they happen.'}
                        </p>
                        {isFiltered && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-all"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5" />
                                                Field
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                Old Value
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <ArrowDownRight className="w-3.5 h-3.5" />
                                                New Value
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <User className="w-3.5 h-3.5" />
                                                Changed By
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Date
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log: any, index: number) => {
                                        const changeType = getChangeType(log.old_value, log.new_value);
                                        const fieldMeta = getFieldMetadata(log.field_name);
                                        const ChangeIcon = changeType.icon;
                                        
                                        return (
                                            <tr 
                                                key={log.id} 
                                                className="hover:bg-blue-50/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-1.5 rounded-lg bg-gray-100/50 group-hover:bg-white transition-colors`}>
                                                            <fieldMeta.icon className={`w-4 h-4 ${fieldMeta.color}`} />
                                                        </div>
                                                        <span className="font-medium text-gray-700">
                                                            {fieldMeta.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500 font-mono text-sm bg-gray-50 px-3 py-1.5 rounded-lg inline-block max-w-[200px] truncate">
                                                            {formatValue(log.old_value)}
                                                        </span>
                                                        <div className={`p-1 rounded-full ${changeType.bg}`}>
                                                            <ChangeIcon className={`w-3.5 h-3.5 ${changeType.color}`} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                        <span className="text-gray-700 font-mono text-sm bg-blue-50/50 px-3 py-1.5 rounded-lg inline-block max-w-[200px] truncate border border-blue-100/30">
                                                            {formatValue(log.new_value)}
                                                        </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${getUserTypeColor(log.changed_by_user_type)} border-2`}>
                                                            {log.changed_by_name ? log.changed_by_name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 text-sm truncate">
                                                                {log.changed_by_name || 'Unknown User'}
                                                            </p>
                                                            {log.changed_by_user_type && (
                                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(activeBusinessRole)} border`}>
                                                                    {getUserTypeBadge(activeBusinessRole)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {new Date(log.created_at).toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {new Date(log.created_at).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50">
                            <Pagination
                                page={page}
                                pageSize={pageSize}
                                totalCount={totalCount}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsTab;