'use client';

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import StatCard from "../../components/properties/StatCard";
import PropertyCard from "../../components/properties/PropertyCard";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Building, Search, X } from "lucide-react";
import { useProperties } from "@/app/hooks/queries/usePropertyQueries";
import { Property } from "@/app/src/types/Types";
import AddPropertyButton from "@/app/components/navigation/AddPropertyButton";


const PropertyPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const {data: propertiesData = [], isLoading} = useProperties();

  const properties = propertiesData ?? [];

  const filteredProperties = useMemo(() => {
    return properties.filter((property: Property) => {
      const matchesSearch = !searchTerm || 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase());
      return  matchesSearch;
    });
  }, [properties, searchTerm]);

  const clearSearch = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  }

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <LoadingSpinner
              size="lg"
              color="blue-600"
              label="Fetching properties..."
              showTimer={true}
            />
          </div>
      );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center space-x-3">
            <Building className="w-10 h-10" />
            <span className="text-3xl font-semibold text-gray-900 uppercase">Properties</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your rental properties
          </p>
        </div>

        <AddPropertyButton />
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value);}}
              placeholder="Search by property name or location..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                outline-none transition-all duration-200 bg-gray-50
                hover:bg-white"
            />
          </div>

          {(searchTerm) && (
            <button
              onClick={clearSearch}
              className="inline-flex items-center px-5 py-2.5
                      bg-gray-100 text-gray-700 rounded-xl
                      hover:bg-gray-200 transition-all duration-200"
            >
              <X className="w-5 h-5 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Properties" value={propertiesData.length} />
        <StatCard title="Total Units" value={propertiesData.reduce((total: number, property: Property) => total + property.units_count, 0)} />
        <StatCard title="Occupied Units" value={propertiesData.reduce((total: number, property: Property) => total + property.occupied_units_count, 0)} />
        <StatCard title="Vacant Units" value={propertiesData.reduce((total: number, property: Property) => total + property.vacant_units_count, 0)} />
        <StatCard title="Units in Maintenance" value={propertiesData.reduce((total: number, property: Property) => total + property.maintenance_units_count, 0)} />
        <StatCard title="Average Occupancy" value={`${Math.round((propertiesData.reduce((total: number, property: Property) => total + property.occupied_units_count, 0) / propertiesData.reduce((total: number, property: Property) => total + property.units_count, 0)) * 100) || 0}%`} />
      </div>

      <div className="space-y-4">
        {filteredProperties.length === 0 && searchTerm ? (
          <div className="col-span-full flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-500 mb-2">
              No properties matching <span className="font-semibold">"{searchTerm}"</span> found
            </p>
          </div>
        ) : (
          filteredProperties.map((property: Property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
          ))
        )}
      </div>
    </div>
  );
};

export default PropertyPage;
