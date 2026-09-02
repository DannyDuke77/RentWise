"use client";

import { useState, useMemo, useEffect } from "react";
import UnitRow from "./UnitRow";
import { Building, ChevronLeft, ChevronRight, Search, CircleX } from "lucide-react";
import { Property, Unit } from "@/app/src/types/Types";
import Pagination from "../ui/Pagination";
import { usePropertyUnits } from "@/app/hooks/queries/usePropertyQueries";
import LoadingSpinner from "../ui/LoadingSpinner";

type Props = {
  property: Property;
};

const UnitsSection = ({ property }: Props) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isFetching } = usePropertyUnits(property.id, page, pageSize);

  const rawUnits: Unit[] = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const [searchTerm, setSearchTerm] = useState("");

  const filteredUnits = useMemo(() => {
    return rawUnits.filter((unit) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        unit.name.toLowerCase().includes(search) ||
        unit.tenant_names?.toLowerCase().includes(search)
      return matchesSearch;
    });
  }, [searchTerm, rawUnits]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { occupied: 0, vacant: 0, maintenance: 0 };
    rawUnits.forEach((unit) => {
      if (unit.status in counts) {
        counts[unit.status]++;
      }
    });
    return counts;
  }, [rawUnits]);

  return (
    <div className="px-2 overflow-y-auto border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Units</h2>
            <p className="text-sm text-gray-500 mt-1">
              {rawUnits.length} units [ {statusCounts.occupied} occupied • {statusCounts.vacant} vacant • {statusCounts.maintenance} maintenance ]
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filters */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                {statusCounts.occupied} Occupied
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                {statusCounts.vacant} Vacant
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                {statusCounts.maintenance} Maintenance
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by unit name, tenant, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500 text-gray-900"
          />
          {searchTerm && (
            <CircleX className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-500" onClick={clearSearch} />
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            Showing {filteredUnits.length} of {filteredUnits.length} units
          </span>
          {searchTerm && (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              Search: "{searchTerm}"
            </span>
          )}
        </div> 
        
      </div>

      {/* Units */}
      {isFetching ? (
        <div className="p-12 text-center">
          <LoadingSpinner
            size="lg"
            color="blue-600"
            label="Fetching units..."
            showTimer={true}
          />
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No matching units" : "No units yet"}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchTerm 
              ? "Try adjusting your search or filter to find what you're looking for."
              : "Start by adding your first unit to manage tenants and rent collection."
            }
          </p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Units Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {filteredUnits.map((unit) => (
              <UnitRow
                key={unit.id}
                property={property}
                unit={unit}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
};

export default UnitsSection;