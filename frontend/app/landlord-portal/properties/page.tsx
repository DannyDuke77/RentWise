'use client';

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import StatCard from "../../components/properties/StatCard";
import PropertyCard from "../../components/properties/PropertyCard";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { 
    AlertCircle, 
    Building, 
    Search, 
    X, 
    Plus, 
    Home, 
    Users, 
    DoorOpen, 
    Wrench, 
    TrendingUp,
    Grid3X3,
    ListFilter
} from "lucide-react";
import { useProperties } from "@/app/hooks/queries/usePropertyQueries";
import { Property } from "@/app/src/types/Types";
import AddPropertyButton from "@/app/components/navigation/AddPropertyButton";
import { useDebounce } from "@/app/hooks/useDebounce";
import Pagination from "@/app/components/ui/Pagination";
import { SearchInput } from "@/app/components/ui/SearchInput";

const PropertyPage = () => {
    const inputRef = useRef<HTMLInputElement>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    
    const effectiveSearch = debouncedSearch.trim();

    const { data: propertiesData, isLoading, isError } = useProperties(
      page,
      pageSize,
      effectiveSearch
    );
    const rawProperties = propertiesData?.results ?? [];
    const totalCount = propertiesData?.count ?? 0;

    // Calculate stats
    const stats = useMemo(() => {
      const totalProperties = rawProperties.length;
      const totalUnits = rawProperties.reduce((sum: number, p: Property) => sum + (p.units_count || 0), 0);
      const occupiedUnits = rawProperties.reduce((sum: number, p: Property) => sum + (p.occupied_units_count || 0), 0);
      const vacantUnits = rawProperties.reduce((sum: number, p: Property) => sum + (p.vacant_units_count || 0), 0);
      const maintenanceUnits = rawProperties.reduce((sum: number, p: Property) => sum + (p.maintenance_units_count || 0), 0);
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

      return {
          totalProperties,
          totalUnits,
          occupiedUnits,
          vacantUnits,
          maintenanceUnits,
          occupancyRate
      };
  }, [rawProperties]);


    if (isError) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-xl shadow-slate-100/50 space-y-6">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-rose-600" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            Unable to load properties
                        </h1>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                            We couldn't retrieve the information for your properties.
                            Check your network connection and try again.
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                      Properties
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Manage all your rental properties in one place
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                    <Grid3X3 className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">
                      {stats.totalProperties} {stats.totalProperties === 1 ? 'property' : 'properties'}
                    </span>
                  </div>
                  <AddPropertyButton />
              </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6">
            <SearchInput onSearchChange={setSearchTerm} />
          </div>

          <div>
            {isLoading ? (
              <div className="min-h-[70vh] flex items-center justify-center p-4">
                <LoadingSpinner
                    size="lg"
                    color="blue-600"
                    label="Loading properties..."
                    showTimer={true}
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Summary Stats */}
                {rawProperties.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    <StatCard 
                        title="Total Properties" 
                        value={stats.totalProperties}
                    />
                    <StatCard 
                        title="Total Units" 
                        value={stats.totalUnits}
                    />
                    <StatCard 
                        title="Occupied" 
                        value={stats.occupiedUnits}
                    />
                    <StatCard 
                        title="Vacant" 
                        value={stats.vacantUnits}
                    />
                    <StatCard 
                        title="Maintenance" 
                        value={stats.maintenanceUnits}
                    />
                    <StatCard 
                        title="Occupancy Rate" 
                        value={`${stats.occupancyRate}%`}
                      />
                  </div>
                )}

                {/* Property List */}
                <div className="space-y-4">
                  {rawProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                          <Building className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          No properties yet
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                          Create your first property to get started
                      </p>
                      <AddPropertyButton />
                    </div>
                  ) : rawProperties.length === 0 && searchTerm ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white border border-gray-200 rounded-2xl">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                          <Search className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                          No properties found
                      </p>
                      <p className="text-sm text-gray-400">
                          Matching <span className="font-medium text-gray-700">"{searchTerm}"</span>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                        {rawProperties.map((property: Property) => (
                          <PropertyCard
                              key={property.id}
                              property={property}
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

                
              </div>
            )}
          </div>

      </div>
    );
};

export default PropertyPage;