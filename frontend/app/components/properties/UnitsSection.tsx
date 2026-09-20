"use client";

import { useState, useMemo, useEffect } from "react";
import UnitRow from "./UnitRow";
import { 
    Building, Search, X, RefreshCcw, Grid3X3, LayoutList,
} from "lucide-react";
import { Property, Unit } from "@/app/src/types/Types";
import Pagination from "../ui/Pagination";
import { usePropertyUnits } from "@/app/hooks/queries/usePropertyQueries";
import LoadingSpinner from "../ui/LoadingSpinner";
import AddUnitButton from "../navigation/AddUnitButton";
import { useDebounce } from "@/app/hooks/useDebounce";
import { SearchInput } from '@/app/components/ui/SearchInput';
import RefreshButton from "../ui/RefreshButton";
import UnitsSectionSkeleton from "../skeletons/UnitsRowsSkeleton";

type Props = {
  property: Property;
};

const UnitsSection = ({ property }: Props) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rentStatusFilter, setRentStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const debouncedSearch = useDebounce(searchTerm, 500);
  const effectiveSearch = debouncedSearch.trim();

  const hasUnits = property?.units_count > 0;

  const { data, isPending, refetch, isFetching } = usePropertyUnits(
    property.id, 
    page, 
    pageSize, 
    effectiveSearch,
    statusFilter,
    rentStatusFilter,
    {
      enabled: hasUnits && !!property.id,
    }
  );

  const rawUnits: Unit[] = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setRentStatusFilter("");
    setPage(1);
  };


  const hasActiveFilters = searchTerm || statusFilter || rentStatusFilter;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Units</h2>
                <p className="text-sm text-gray-500">
                  {property.units_count} {property.units_count === 1 ? 'unit' : 'units'} in {property.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {property.occupied_units_count} Occupied
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-200">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                {property.vacant_units_count} Vacant
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                {property.maintenance_units_count} Maintenance
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RefreshButton isFetching={isFetching} refetch={refetch} />
              <AddUnitButton property={property} />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="flex-1 min-w-[200px]">
            <SearchInput 
              onSearchChange={setSearchTerm} 
              placeholder="Search by unit name or tenant..."
            />
          </div>

          <div className="flex items-center gap-2">
            <select 
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-w-[130px]"
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <select 
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-w-[130px]"
              value={rentStatusFilter} 
              onChange={e => setRentStatusFilter(e.target.value)}
            >
              <option value="">All Rent Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="vacant">Vacant</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Units */}
      {isPending || isFetching ? (
          <UnitsSectionSkeleton />
      ) : rawUnits.length === 0 ? (
        <div className="p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
            <Building className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {hasActiveFilters ? "No units found" : "No units yet"}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto text-sm">
            {hasActiveFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : `Start by adding your first unit to ${property.name}.`
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Showing <strong className="text-gray-900">{rawUnits.length}</strong> of <strong className="text-gray-900">{totalCount}</strong> units
              </span>
              {searchTerm && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                  <Search className="w-3 h-3" />
                  "{searchTerm}"
                </span>
              )}
              {statusFilter && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                  {statusFilter}
                </span>
              )}
              {rentStatusFilter && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                  Rent: {rentStatusFilter}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 hidden lg:flex">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Grid view"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="List view"
                >
                  <LayoutList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Units Grid/List */}
          <div className={`p-4 ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' 
              : 'space-y-2'
          }`}>
            {rawUnits.map((unit) => (
              <UnitRow
                key={unit.id}
                property={property}
                unit={unit}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default UnitsSection;