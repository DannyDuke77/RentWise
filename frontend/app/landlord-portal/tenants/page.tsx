'use client';

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { 
  Building, PhoneIcon, UserIcon,
  CheckCircleIcon, HistoryIcon, Users, Search, X, 
  Filter, ChevronRight, ChevronDown as ChevronDownIcon,
  ArrowRight
} from "lucide-react";
import { useTenants } from "@/app/hooks/queries/useTenantsQueries";
import { Tenant } from "@/app/src/types/Types";
import Pagination from "@/app/components/ui/Pagination";
import { SearchInput } from "@/app/components/ui/SearchInput";
import { useDebounce } from "@/app/hooks/useDebounce";
import Link from "next/link";
import CustomTooltip from "@/app/components/ui/CustomTooltip";

// Helper functions for tenancy display
const getUniqueProperties = (tenancies: any[]) => {
  if (!tenancies?.length) return null;
  
  const propertyMap = new Map();
  tenancies.forEach(t => {
    if (!propertyMap.has(t.property.name)) {
      propertyMap.set(t.property.name, []);
    }
    if (t.unit.name) {
      propertyMap.get(t.property.name).push(t.unit.name);
    }
  });
  
  return {
    propertyNames: Array.from(propertyMap.keys()),
    allUnits: Array.from(propertyMap.values()).flat(),
    hasMultiple: propertyMap.size > 1
  };
};

// Helper function to format tenancy counts
const getTenancyCountDisplay = (tenancies: any[]) => {
  if (!tenancies?.length) return null;
  
  const activeCount = tenancies.filter(t => t.is_active).length;
  const inactiveCount = tenancies.filter(t => !t.is_active).length;
  
  const parts = [];
  if (activeCount > 0) parts.push(`${activeCount} active`);
  if (inactiveCount > 0) parts.push(`${inactiveCount} inactive`);
  
  return parts.length > 0 ? `(${parts.join(', ')})` : null;
};

const TenancyCell = ({ tenancies }: { tenancies: any[] }) => {
  const data = getUniqueProperties(tenancies);
  
  if (!data) {
    return <span className="text-gray-400 text-sm">N/A</span>;
  }

  const { propertyNames, allUnits, hasMultiple } = data;
  
  let propertyDisplay = propertyNames.map(name => 
    hasMultiple && name.length > 4 ? name.substring(0, 4) + '…' : name
  ).join(', ');

  const unitDisplay = allUnits.length > 0 ? allUnits.join(', ') : '';

  return (
    <div className="space-y-1 relative group">
      <div className="flex items-start gap-1.5">
        <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
        <p  className="text-sm text-gray-600 truncate min-w-0 flex-1" >
          {propertyDisplay}
        </p>
      </div>
      {unitDisplay && (
        <div className="flex items-start gap-1.5 pl-5">
          <p 
            className="text-xs text-gray-400 truncate min-w-0 flex-1" 
            title={`Units: ${unitDisplay}`}
          >
            {unitDisplay}
          </p>
        </div>
      )}
      {hasMultiple && <CustomTooltip message={propertyNames.join(', ')} />}
    </div>
  );
};

const TenantsPage = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 500);
  const effectiveSearch = debouncedSearch.trim();

  const { data: tenantData, isLoading, isError } = useTenants(
    page, 
    pageSize,
    effectiveSearch,
    filterMethod
  );

  const rawTenants: Tenant[] = tenantData?.results ?? [];
  const totalCount = tenantData?.count ?? 0;

  const isActive = (tenant: Tenant) => tenant.tenancies?.some((t) => t.is_active);

  const toggleRow = (tenantId: string) => {
    const newExpanded = new Set(expandedRows);
    newExpanded.has(tenantId) ? newExpanded.delete(tenantId) : newExpanded.add(tenantId);
    setExpandedRows(newExpanded);
  };

  useEffect(() => setPage(1), [filterMethod, searchTerm, pageSize]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-GB", {
    year: "numeric", month: "short", day: "numeric"
  });

  if (isError) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold text-gray-900">Unable to load tenants</h1>
    </div>
  );

  const StatusBadge = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 border rounded-full ${
      active ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-100 border-gray-200'
    }`}>
      {active ? (
        <><CheckCircleIcon className="w-3.5 h-3.5 mr-1.5" /> Active</>
      ) : (
        <><HistoryIcon className="w-3.5 h-3.5 mr-1.5" /> Inactive</>
      )}
    </span>
  );

  const StatCard = ({ label, value, color = 'gray' }: any) => (
    <div className={`bg-white rounded-xl border p-5 shadow-sm ${
      color !== 'gray' ? `border-l-4 border-l-${color}-500` : ''
    }`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${color !== 'gray' ? `text-${color}-600` : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="max-w-8xl space-y-8 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3">
          <Users className="w-10 h-10 text-blue-600" />
          <span className="text-3xl font-bold text-gray-900 uppercase">Tenants</span>
        </h1>
        <p className="mt-2 text-gray-600">Historical and active tracking of all residents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Records" value={totalCount} />
        <StatCard label="Currently Renting (Page)" value={rawTenants.filter(t => isActive(t)).length} color="green" />
        <StatCard label="Past Tenants (Page)" value={rawTenants.filter(t => !isActive(t)).length} color="amber" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <SearchInput
              onSearchChange={setSearchTerm}
            />
          </div>

          <div className="relative min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white appearance-none cursor-pointer transition"
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="True">Active</option>
              <option value="False">Inactive</option>
            </select>
          </div>

          {(searchTerm || filterMethod) && (
            <button
              onClick={() => { setSearchTerm(""); setFilterMethod(""); }}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex-shrink-0"
            >
              <X className="w-5 h-5 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner 
          label="Loading tenants..." 
        />
      
      ) : rawTenants.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-20 text-center">
          <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tenants found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  {['Tenant', 'Contact', 'Status', 'Properties', 'Actions'].map((label, i) => (
                    <th key={i} className="text-left py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawTenants.map((tenant) => {
                  const active = isActive(tenant);
                  const expanded = expandedRows.has(tenant.id);
                  const countDisplay = getTenancyCountDisplay(tenant.tenancies);

                  return (
                    <Fragment key={tenant.id}>
                      {/* Main Row */}
                      <tr className={`hover:bg-blue-50/30 transition-colors ${expanded ? 'bg-blue-50/20' : ''}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                              {tenant.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{tenant.full_name}</p>
                              {tenant.email && <p className="text-xs text-gray-500">{tenant.email}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            {tenant.phone}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">ID: {tenant.id_number}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge active={active} />
                        </td>

                        <td className="py-3.5 px-4 max-w-[200px]">
                          <TenancyCell tenancies={tenant.tenancies} />
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleRow(tenant.id)}
                            className="p-1.5 flex items-center gap-1 text-gray-500 hover:text-gray-600 text-sm hover:bg-gray-100 rounded-lg transition-all duration-300"
                          >
                            <ChevronRight 
                              className={`w-4 h-4 transition-transform duration-300 ${
                                expanded ? 'rotate-90' : ''
                              }`}
                            /> View
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      <tr className="bg-blue-50/5">
                        <td colSpan={5} className="px-0 py-0 overflow-hidden">
                          <div 
                            className={`
                              transition-all duration-300 ease-in-out
                              ${expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
                            `}
                          >
                            <div className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                                {/* Personal Info */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-blue-500" />
                                    Personal Information
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      ['Full Name', tenant.full_name],
                                      ['ID Number', tenant.id_number],
                                      ['Phone', tenant.phone],
                                      ['Email', tenant.email || '—'],
                                      ['Member Since', formatDate(tenant.created_at), 'col-span-2']
                                    ].map(([label, value, colSpan]) => (
                                      <div key={label} className={`bg-gray-50 p-3 rounded-lg ${colSpan || ''}`}>
                                        <p className="text-xs text-gray-500">{label}</p>
                                        <p className={`text-sm font-medium text-gray-900 ${label === 'ID Number' ? 'font-mono' : ''}`}>
                                          {value}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Occupancy History */}
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                      <Building className="w-4 h-4 text-blue-500" />
                                      Occupancy History
                                    </h4>
                                    {countDisplay && (
                                      <p className="text-xs text-gray-500 mt-1 ml-6">
                                        {countDisplay}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {tenant.tenancies?.length ? tenant.tenancies.map(t => (
                                      <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                                        t.is_active ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'
                                      }`}>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <Building className={`h-4 w-4 ${t.is_active ? 'text-blue-500' : 'text-gray-400'}`} />
                                            <p className={`text-sm font-medium ${t.is_active ? 'text-blue-900' : 'text-gray-700'}`}>
                                              {t.property.name}
                                            </p>
                                          </div>
                                          <p className="text-xs text-gray-500 ml-6">Unit {t.unit.name}</p>
                                          <p className="text-xs text-gray-400 ml-6">
                                            {formatDate(tenant.created_at)} — {t.end_date ? formatDate(t.end_date) : 'Present'}
                                          </p>
                                        </div>
                                        {t.is_active && (
                                          <Link
                                            href={`/properties/${t.property.id}/units/${t.unit.id}`}
                                            className="p-1.5 flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline text-sm hover:bg-gray-100 rounded-lg transition-all duration-300"
                                          >
                                            Go to unit <ArrowRight className="w-4 h-4" /> 
                                          </Link>
                                        )}
                                        
                                      </div>
                                    )) : (
                                      <p className="text-sm text-gray-500 text-center py-6">No tenancy history</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default TenantsPage;