import AddUnitButton from "@/app/components/navigation/AddUnitButton";
import UnitsSection from "@/app/components/properties/UnitsSection";
import apiService from "@/app/services/apiService";
import { Building } from "lucide-react";
import PropertyRentSummary from "@/app/components/properties/PropertyRentSummary";

const PropertyDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  console.log("Property ID:", id);

  let property;
  
  try {
    property = await apiService.get(`/api/properties/${id}`);
    console.log("Property:", property);
  } catch (error) {
    return (
      <div className="mt-24 w-full max-w-sm mx-auto p-6 text-center text-red-600 bg-red-50 rounded-xl shadow">
        <Building className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold">Error fetching property</h1>
        <p className="mt-2 text-sm text-red-700">
          Something went wrong while loading the property. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8 mx-auto">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between md:gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-gray-500">{property.location}</p>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Edit Property
          </button>
          <AddUnitButton property={property} />
        </div>
      </div>

      <PropertyRentSummary propertyId={id} property={property} units={property.units} defaultExpanded={false} />

      {/* Units Section */}
      <UnitsSection units={property.units} />
    </div>
  );
};

export default PropertyDetailPage;
