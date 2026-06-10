import AddUnitButton from "@/app/components/navigation/AddUnitButton";
import UnitsSection from "@/app/components/properties/UnitsSection";
import apiService from "@/app/services/apiService";
import { Building } from "lucide-react";
import PropertyRentSummary from "@/app/components/properties/PropertyRentSummary";

const PropertyDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  console.log("Property ID:", id);

  let dashboardData, unitsData;

  try {
    dashboardData = await apiService.get(`/api/properties/${id}/rent-summary/`);
    unitsData = await apiService.get(`/api/properties/${id}/units/`);
  } catch (error) {
    console.error("Error fetching property data:", error);
  
    return (
      <div className="mx-auto my-16 w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 border border-rose-100/60 text-rose-600">
          <Building className="h-5 w-5 stroke-[2]" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
            Unable to load property details
          </h1>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
            We couldn't fetch the details for this property. Please check your connection and try again. If the problem persists, contact support.
          </p>
        </div>
      </div>
    );
  }

  const property = dashboardData;
  const units = unitsData.results;

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

    <PropertyRentSummary propertyId={id} property={property} units={units} defaultExpanded={false} />

    {/* Units Section */}
    <UnitsSection property={property} units={units} />
  </div>
  );
};

export default PropertyDetailPage;