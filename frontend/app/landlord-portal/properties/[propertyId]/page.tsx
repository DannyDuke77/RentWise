'use client';

import { useParams } from "next/navigation";
import AddUnitButton from "@/app/components/navigation/AddUnitButton";
import UnitsSection from "@/app/components/properties/UnitsSection";
import PropertyRentSummary from "@/app/components/properties/PropertyRentSummary";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { usePropertyDetail } from "@/app/hooks/queries/usePropertyQueries";
import { Building } from "lucide-react";
import PaymentStats from "@/app/components/payments/PaymentStats";

const PropertyDetailPage = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  
  const { data: property, isLoading, isError } = usePropertyDetail(propertyId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner
          size="lg"
          color="blue-600"
          label="Fetching property details..."
          showTimer={true}
        />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="mx-auto my-16 w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 border border-rose-100/60 text-rose-600">
          <Building className="h-5 w-5 stroke-[2]" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight">Unable to load property details</h1>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
            We couldn't fetch the details for this property. Please check your connection and try again. If the problem persists, contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8 mx-auto">
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

      <PropertyRentSummary propertyId={propertyId} property={property} defaultExpanded={false} />
      <PaymentStats label={`Payment Analytics for ${property.name}`} propertyId={propertyId} />
      <UnitsSection property={property} />
    </div>
  );
};

export default PropertyDetailPage;