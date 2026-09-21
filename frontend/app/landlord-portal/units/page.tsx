"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Home,
  X,
  Filter,
  ArrowRight,
  Phone,
  ChevronDown,
} from "lucide-react";
import { useUnits } from "@/app/hooks/queries/useUnitsQueries";
import Pagination from "@/app/components/ui/Pagination";
import { SearchInput } from "@/app/components/ui/SearchInput";
import { useDebounce } from "@/app/hooks/useDebounce";
import BusinessStatsGrid from "@/app/components/properties/BusinessStatsGrid";
import TableSkeleton from "@/app/components/skeletons/TableSkeleton";
import { useProperties, usePropertiesStats } from "@/app/hooks/queries/usePropertyQueries";
import { Property, UnitRow } from "@/app/src/types/Types";

/* ─────────── helpers ─────────── */

const STATUS_STYLES: Record<string, string> = {
  occupied: "text-emerald-700 bg-emerald-50 border-emerald-200",
  vacant: "text-amber-700 bg-amber-50 border-amber-200",
  maintenance: "text-rose-700 bg-rose-50 border-rose-200",
};

const STATUS_DOT: Record<string, string> = {
  occupied: "bg-emerald-500",
  vacant: "bg-amber-500",
  maintenance: "bg-rose-500",
};

const currency = (n: number | null, code = "KES") =>
  n === null
    ? "—"
    : new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: code,
        maximumFractionDigits: 0,
      }).format(n);

/* ─────────── page ─────────── */

const UnitsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 500);
  const effectiveSearch = debouncedSearch.trim();

  const { data: unitsData, isPending, isError } = useUnits(
    page,
    pageSize,
    effectiveSearch,
    statusFilter,
    propertyFilter,
  );
  const rawUnits: UnitRow[] = unitsData?.results ?? [];
  const totalCount = unitsData?.count ?? 0;

  const { data: statsData, isPending: isStatsPending } = usePropertiesStats();

  const { data: propertiesData } = useProperties(1, 100, "");

    const propertyOptions = useMemo(
    () =>
        (propertiesData?.results ?? []).map((p: { id: string; name: string }) => ({
        id: p.id,
        name: p.name,
        })),
    [propertiesData]
    );

  const hasActiveFilters = !!(searchTerm || statusFilter || propertyFilter);
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPropertyFilter("");
  };

  useEffect(() => {
    setPage(1);
  }, [effectiveSearch, statusFilter, propertyFilter, pageSize]);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">
            Unable to load units
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Something went wrong. Try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Home className="w-10 h-10 text-slate-900" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Units</h1>
            <p className="text-gray-600">
              All units across your properties in one view
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <BusinessStatsGrid stats={statsData} isPending={isStatsPending} />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              onSearchChange={setSearchTerm}
              placeholder="Search by unit, property, or tenant..."
            />
          </div>

          <div className="relative min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white appearance-none cursor-pointer transition"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                >
                <option value="">All Properties</option>
                {propertyOptions.map((p: Property) => (
                    <option key={p.id} value={p.id}>
                    {p.name}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 appearance-none hover:bg-whitecursor-pointer transition"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex-shrink-0"
            >
              <X className="w-5 h-5 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isPending ? (
        <TableSkeleton rows={10} cols={5} />
      ) : rawUnits.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-20 text-center">
          <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {hasActiveFilters ? "No units match your filters." : "No units yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  {["Unit", "Property", "Status", "Tenant", "Rent", "Balance", "Deposit", "Actions"].map(
                    (label, i) => (
                      <th
                        key={i}
                        className="text-left py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rawUnits.map((unit) => {
                  const inArrears = unit.balance !== null && unit.balance > 0;

                  return (
                    <tr key={unit.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                            {unit.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{unit.name}</p>
                            {unit.floor && (
                              <p className="text-xs text-gray-500">Floor {unit.floor}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{unit.property.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 border rounded-full capitalize ${
                            STATUS_STYLES[unit.status] ?? ""
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              STATUS_DOT[unit.status] ?? ""
                            }`}
                          />
                          {unit.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        {unit.tenant_names ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="truncate" title={unit.tenant_names}>
                              {unit.tenant_names}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-sm text-gray-700 whitespace-nowrap">
                        {currency(parseFloat(unit.monthly_rent))}
                      </td>

                      <td className="py-3.5 px-4">
                        {unit.balance === null ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : inArrears ? (
                          <span className="text-sm font-semibold text-rose-600">
                            {currency(unit.balance)}
                          </span>
                        ) : unit.balance < 0 ? (
                          <span className="text-sm font-medium text-emerald-600">
                            {currency(unit.balance)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Settled</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-sm text-gray-700 whitespace-nowrap">
                        {unit.deposit == null ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          currency(unit.deposit)
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/properties/${unit.property.id}/units/${unit.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                        >
                          View Unit
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
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

export default UnitsPage;
