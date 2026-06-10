'use client';

import { useEffect, useState, useRef } from "react";
import StatCard from "../components/properties/StatCard";
import PropertyCard from "../components/properties/PropertyCard";
import apiService from "../services/apiService";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import UnitsSection from "@/app/components/properties/UnitsSection";
import { get } from "http";
import { Building, Search, X } from "lucide-react";

export type PropertyType = {
  id: string;
  name: string;
  location: string;
  units_count: number;
  occupied_units_count: number;
  vacant_units_count: number;
  maintenance_units_count: number;
  occupancy: string;
  status: "full" | "partial" | "low";
}

const PropertyPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);


  const getProperties = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    let url = '/api/properties/';

    if (searchQuery) {
      url += `?q=${encodeURIComponent(searchQuery)}`;
    }

    try {
      const response = await apiService.get(url);
      
      if (response) {
        setProperties(response.results);
      } else {
        setProperties([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getProperties(query);
  }, [query]);

  const handleSearch = () => {
    setQuery(input);
  }

  const handleClear = () => {
    setInput("");
    setQuery("");
  }

  if (loading) {
      return (
          <LoadingSpinner 
              size="lg" 
              color="blue-600" 
              label="Fetching properties..." 
          />
      );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="border rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            {error}
          </p>
        </div>
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

        <button 
          onClick={() => {
            window.location.href = '/properties/add';
          }}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
          + Add Property
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search by property name or location..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      outline-none transition-all duration-200 bg-gray-50
                      hover:bg-white"
            />
          </div>

          <button
            onClick={handleSearch}
            className="inline-flex items-center justify-center px-5 py-2.5
                    bg-blue-600 text-white rounded-xl
                    hover:bg-blue-700 transition-all duration-200"
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </button>

          {(input || query) && (
            <button
              onClick={handleClear}
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
        <StatCard title="Total Properties" value={properties.length} />
        <StatCard title="Total Units" value={properties.reduce((total: number, property: PropertyType) => total + property.units_count, 0)} />
        <StatCard title="Occupied Units" value={properties.reduce((total: number, property: PropertyType) => total + property.occupied_units_count, 0)} />
        <StatCard title="Vacant Units" value={properties.reduce((total: number, property: PropertyType) => total + property.vacant_units_count, 0)} />
        <StatCard title="Units in Maintenance" value={properties.reduce((total: number, property: PropertyType) => total + property.maintenance_units_count, 0)} />
        <StatCard title="Average Occupancy" value={`${Math.round((properties.reduce((total: number, property: PropertyType) => total + property.occupied_units_count, 0) / properties.reduce((total: number, property: PropertyType) => total + property.units_count, 0)) * 100) || 0}%`} />
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
              units_count={property.units_count}
              occupied_units_count={property.occupied_units_count}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PropertyPage;
