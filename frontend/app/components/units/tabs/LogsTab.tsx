'use client';

import { useState } from 'react';
import {
  History, X, Clock, User, Calendar, FileText, ArrowUpRight, ArrowDownLeft, Minus,
  Filter, ChevronDown, ArrowRight, ArrowDownRight, AlertCircle, Hash, Tag, Layers
} from 'lucide-react';
import { useChangeLogs } from '@/app/hooks/queries/useChangeLogQueries';
import { useDebounce } from '@/app/hooks/useDebounce';
import Pagination from '@/app/components/ui/Pagination';
import RefreshButton from '../../ui/RefreshButton';
import { useBusiness } from '@/app/providers/BusinessProvider';
import TableSkeleton from '../../skeletons/TableSkeleton';
import { SearchInput } from '../../ui/SearchInput';

interface ChangeLogTableProps {
  unitId?: string;
  propertyId?: string;
}

const FIELD_METADATA: Record<string, { icon: any; color: string; label: string }> = {
  name: { icon: Tag, color: 'text-blue-500', label: 'Name' },
  status: { icon: AlertCircle, color: 'text-amber-500', label: 'Status' },
  monthly_rent: { icon: Hash, color: 'text-emerald-500', label: 'Monthly Rent' },
  floor: { icon: Layers, color: 'text-purple-500', label: 'Floor' },
};

const COLUMNS = [
  { key: 'field', label: 'Field', icon: FileText },
  { key: 'old_value', label: 'Old Value', icon: ArrowUpRight },
  { key: 'new_value', label: 'New Value', icon: ArrowDownRight },
  { key: 'changed_by', label: 'Changed By', icon: User },
  { key: 'created_at', label: 'Date', icon: Calendar },
] as const;

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

  const getUserTypeColor = (type: string | null) => {
    switch (type) {
      case 'staff': return 'bg-blue-500/10 text-blue-700 border-blue-200/50';
      case 'owner': return 'bg-purple-500/10 text-purple-700 border-purple-200/50';
      case 'manager': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200/50';
    }
  };

  const getUserTypeBadge = (type: string | null) => {
    const labels = { staff: 'Staff', owner: 'Owner', manager: 'Manager' };
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
    if (value === 'true' || value === 'false') return value === 'true' ? 'Yes' : 'No';
    return value;
  };

  const getFieldMetadata = (fieldName: string) => {
    return FIELD_METADATA[fieldName] || {
      icon: FileText,
      color: 'text-gray-500',
      label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
    };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFieldFilter('');
    setPage(1);
  };

  const isFiltered = !!(searchTerm || fieldFilter);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 lg:flex items-center justify-between border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Activity Log
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {logs.length} of {totalCount.toLocaleString()} changes
            </p>
          </div>

          <div className="sm:flex sm:items-center mt-6 lg:mt-0 gap-4 space-y-4 sm:space-y-0">
            <SearchInput
              onSearchChange={setSearchTerm}
              placeholder="Search changes..."
            />

            <div className="relative min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white appearance-none cursor-pointer transition"
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
              >
                <option value="">All Fields</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="monthly_rent">Monthly Rent</option>
                <option value="floor">Floor</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {isFiltered && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex-shrink-0"
              >
                <X className="w-5 h-5 mr-2" />
                Clear
              </button>
            )}

            <RefreshButton isFetching={isFetching} refetch={refetch} />
          </div>
        </div>

        {/* Table */}
        {isFetching ? (
          <TableSkeleton rows={10} cols={5} />
        ) : logs.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-20 text-center m-6">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {isFiltered
                ? 'No changes match your filters.'
                : 'Changes to this unit will appear here.'}
            </p>
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    {COLUMNS.map(({ key, label, icon: Icon }) => (
                      <th
                        key={key}
                        className="text-left py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log: any) => {
                    const changeType = getChangeType(log.old_value, log.new_value);
                    const fieldMeta = getFieldMetadata(log.field_name);
                    const FieldIcon = fieldMeta.icon;
                    const ChangeIcon = changeType.icon;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-300/20 transition-colors group"
                      >
                        {/* Field */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-gray-100/50 group-hover:bg-white transition-colors">
                              <FieldIcon className={`w-4 h-4 ${fieldMeta.color}`} />
                            </div>
                            <span className="font-medium text-gray-900">
                              {fieldMeta.label}
                            </span>
                          </div>
                        </td>

                        {/* Old Value */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-1.5 rounded-lg inline-block max-w-[200px] truncate">
                              {formatValue(log.old_value)}
                            </span>
                            <div className={`p-1 rounded-full ${changeType.bg}`}>
                              <ChangeIcon className={`w-3.5 h-3.5 ${changeType.color}`} />
                            </div>
                          </div>
                        </td>

                        {/* New Value */}
                        <td className="py-3.5 px-4">
                          <span className="text-sm text-gray-700 font-mono bg-blue-50/50 px-3 py-1.5 rounded-lg inline-block max-w-[200px] truncate border border-blue-100/30">
                            {formatValue(log.new_value)}
                          </span>
                        </td>

                        {/* Changed By */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${getUserTypeColor(
                                log.changed_by_user_type
                              )}`}
                            >
                              {log.changed_by_name
                                ? log.changed_by_name.charAt(0).toUpperCase()
                                : '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {log.changed_by_name || 'Unknown User'}
                              </p>
                              {log.changed_by_user_type && (
                                <span
                                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUserTypeColor(
                                    activeBusinessRole
                                  )}`}
                                >
                                  {getUserTypeBadge(activeBusinessRole)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium text-gray-700">
                              {formatDate(log.created_at)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatTime(log.created_at)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsTab;