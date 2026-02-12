"use client";

import { useState, useMemo, useEffect } from "react";
import UnitRow from "./UnitRow";
import { UnitType } from "../modals/UnitModal";
import { Building, ChevronLeft, ChevronRight, Search, Filter, Home, Circle, CircleX } from "lucide-react";
import AddUnitButton from "../navigation/AddUnitButton";

type Props = {
  units: UnitType[];
};

const UnitsSection = ({ units }: Props) => {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUnits = useMemo(() => {
    if (!query.trim()) return units;

    const q = query.toLowerCase();

    return units.filter((unit: any) => {
      const unitName = unit.name?.toLowerCase() || "";
      const status = unit.status?.toLowerCase() || "";
      const tenantNames = unit.tenant_names?.toLowerCase() || "";
      
      return (
        unitName.includes(q) ||
        status.includes(q) ||
        tenantNames.includes(q) // This works for "David" or "Francis" or "Kamau"
      );
    });
  }, [query, units]);

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(filteredUnits.length / PAGE_SIZE);

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUnits.slice(start, start + PAGE_SIZE);
  }, [filteredUnits, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { occupied: 0, vacant: 0, maintenance: 0 };
    units.forEach(unit => {
      counts[unit.status]++;
    });
    return counts;
  }, [units]);

  return (
    <div className="px-2 max-h-[550px] overflow-y-auto border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3  border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Units</h2>
            <p className="text-sm text-gray-500 mt-1">
              {units.length} units [ {statusCounts.occupied} occupied • {statusCounts.vacant} vacant • {statusCounts.maintenance} maintenance ]
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filters (Optional) */}
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500 text-gray-900"
          />
          {query && (
            <CircleX className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-500" onClick={() => setQuery("")} />
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            Showing {paginatedUnits.length} of {filteredUnits.length} units
          </span>
          {query && (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              Search: "{query}"
            </span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredUnits.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {query ? "No matching units" : "No units yet"}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {query 
              ? "Try adjusting your search or filter to find what you're looking for."
              : "Start by adding your first unit to manage tenants and rent collection."
            }
          </p>
          {query && (
            <button
              onClick={() => setQuery("")}
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
            {paginatedUnits.map((unit) => (
              <UnitRow
                key={unit.id}
                unit={unit}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">
                    {(currentPage - 1) * PAGE_SIZE + 1}
                  </span> to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(currentPage * PAGE_SIZE, filteredUnits.length)}
                  </span> of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredUnits.length}
                  </span> units
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-gray-900 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UnitsSection;