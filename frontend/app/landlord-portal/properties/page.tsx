'use client';

import { useMemo, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import PropertyCard from "../../components/properties/PropertyCard";
import { 
    AlertCircle, 
    Building, 
    Search, 
    Grid3X3,
    Building2,
    Home,
    UserCheck,
    UserMinus,
    Wrench,
    TrendingUp
} from "lucide-react";
import { useProperties, usePropertiesStats } from "@/app/hooks/queries/usePropertyQueries";
import { Property } from "@/app/src/types/Types";
import AddPropertyButton from "@/app/components/navigation/AddPropertyButton";
import { useDebounce } from "@/app/hooks/useDebounce";
import Pagination from "@/app/components/ui/Pagination";
import { SearchInput } from "@/app/components/ui/SearchInput";
import { useBusiness } from "@/app/providers/BusinessProvider";
import PropertiesPageSkeleton from "@/app/components/skeletons/PropertiesPageSkeleton";

const PropertyPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const effectiveSearch = debouncedSearch.trim();

  const { data: propertiesData, isPending: isPropertiesPending, isError } = useProperties(
    page,
    pageSize,
    effectiveSearch
  );
  const rawProperties = propertiesData?.results ?? [];
  const totalCount = propertiesData?.count ?? 0;

  const { data: statsData, isPending: isStatsPending } = usePropertiesStats();

  if (isError || !rawProperties) {
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
              We couldn't retrieve your property information. Check your connection and try again.
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

  if (isPropertiesPending || isStatsPending) return <PropertiesPageSkeleton />;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="">
            <Building className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Properties
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage all your rental properties in one place
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 rounded-full border border-slate-200">
            <Grid3X3 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-600">
              {statsData?.total_properties} {statsData?.total_properties === 1 ? 'property' : 'properties'}
            </span>
          </div>
          <AddPropertyButton />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6">
        <SearchInput onSearchChange={setSearchTerm} />
      </div>
      
      <div className="space-y-6">
        {rawProperties.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
            <StatCard 
              title="Total Properties" 
              value={statsData.total_properties} 
              icon={Building2}
              color="text-blue-600"
              bg="bg-blue-50"
              ring="ring-blue-500/10"
              isPending={isStatsPending}
            />
            <StatCard 
              title="Total Units" 
              value={statsData.total_units} 
              icon={Home}
              color="text-indigo-600"
              bg="bg-indigo-50"
              ring="ring-indigo-500/10"
              isPending={isStatsPending}
            />
            <StatCard 
              title="Occupied" 
              value={statsData.total_occupied} 
              icon={UserCheck}
              color="text-emerald-600"
              bg="bg-emerald-50"
              ring="ring-emerald-500/10"
              isPending={isStatsPending}
            />
            <StatCard 
              title="Vacant" 
              value={statsData.total_vacant} 
              icon={UserMinus}
              color="text-amber-600"
              bg="bg-amber-50"
              ring="ring-amber-500/10"
              isPending={isStatsPending}
            />
            <StatCard 
              title="Maintenance" 
              value={statsData.total_maintenance} 
              icon={Wrench}
              color="text-rose-600"
              bg="bg-rose-50"
              ring="ring-rose-500/10"
              isPending={isStatsPending}
            />
            <StatCard 
              title="Occupancy Rate" 
              value={`${statsData.occupancy_rate.toFixed(2)}%`} 
              icon={TrendingUp}
              color="text-purple-600"
              bg="bg-purple-50"
              ring="ring-purple-500/10"
              isPending={isStatsPending}
            />
          </div>
        )}

        {rawProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                {effectiveSearch ? <Search className="w-8 h-8" /> : <Building className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {effectiveSearch ? "No properties found" : "No properties yet"}
            </h3>
            <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
                {effectiveSearch 
                  ? <>No results matching <span className="font-medium text-slate-700">"{effectiveSearch}"</span></>
                  : "Create your first property to get started with management."
                }
            </p>
            {!effectiveSearch && <AddPropertyButton />}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
              {rawProperties.map((property: Property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
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
  );
};

export default PropertyPage;