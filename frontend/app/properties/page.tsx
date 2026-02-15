'use client';

import { useEffect, useState, useRef } from "react";
import StatCard from "../components/properties/StatCard";
import PropertyCard from "../components/properties/PropertyCard";
import apiService from "../services/apiService";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import UnitsSection from "@/app/components/properties/UnitsSection";
import { get } from "http";

export type PropertyType = {
  id: string;
  name: string;
  location: string;
  units: any;
  occupancy: string;
  status: "full" | "partial" | "low";
}

const PropertyPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);


  const getProperties = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    let url = '/api/properties/';

    if (searchQuery) {
      url += `?q=${encodeURIComponent(searchQuery)}`;
      setLoading(false);
    }

    const response = await apiService.get(url);

    if (response){
      console.log("response", response);
      setProperties(response.properties);
      setLoading(false);
      
    } else {
      setProperties([]);
    }
  }

  useEffect(() => {
    getProperties(query);
  }, [query]);

  if (loading) {
      return (
          <LoadingSpinner 
              size="lg" 
              color="blue-600" 
              label="Fetching properties..." 
          />
      );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500">
            Manage your rental properties
          </p>
        </div>

        <button 
          onClick={() => {
            window.location.href = '/properties/add';
          }}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
          + Add Property
        </button>
      </div>

      <div className="mb-4 flex">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by property name or location"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  outline-none"
          onKeyDown={(e) => {
              if (e.key === 'Enter') {
                  getProperties(query);
              }
          }}
        />

        {query && (
          <button 
            onClick={() => {
              setQuery("");
            }}
            className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600
                    focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                    outline-none"
          >
            Clear
          </button>
        )}
    </div>  

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Properties" value={properties.length} />
        <StatCard title="Total Units" value={properties.reduce((total: number, property: PropertyType) => total + property.units.length, 0)} />
        <StatCard title="Occupied Units" value={properties.reduce((total: number, property: PropertyType) => total + property.units.filter((unit: any) => unit.status === 'occupied').length, 0)} />
        <StatCard title="Vacant Units" value={properties.reduce((total: number, property: PropertyType) => total + property.units.filter((unit: any) => unit.status === 'vacant').length, 0)} />
        <StatCard title="Units in Maintenance" value={properties.reduce((total: number, property: PropertyType) => total + property.units.filter((unit: any) => unit.status === 'maintenance').length, 0)} />
      </div>

      <div className="space-y-4">
        {properties.length === 0 && query ? (
          <div className="border rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">
              No properties matching <span className="font-semibold">"{query}"</span> found
            </p>
          </div>
        ) : (
          properties.map((property: PropertyType) => (
            <PropertyCard
              id={property.id}
              key={property.id}
              name={property.name}
              location={property.location}
              units={property.units.length}
              occupancy={
                property.units.filter(
                  (unit: any) => unit.status === 'occupied'
                ).length
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PropertyPage;
