'use client';

import { useParams } from "next/navigation";
import UnitsSection from "@/app/components/properties/UnitsSection";
import PropertyRentSummary from "@/app/components/payments/MonthlyRentSummary";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { useProperty } from "@/app/hooks/queries/usePropertyQueries";
import { Building, Building2, MapPin, Pin } from "lucide-react";
import PaymentAnalytics from "@/app/components/payments/PaymentAnalytics";

const PropertyDetailPage = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  
  const { data: property, isLoading, isError } = useProperty(propertyId);

  if (isLoading || !property) {
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

  if (isError) {
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
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Building2 className="h-10 w-10 stroke-[2]" />
            {property.name}
          </h1>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-5 w-5 stroke-[2]" /> 
            {property.location}
          </p>
        </div>
      </div>

      <PropertyRentSummary propertyId={propertyId} property={property} defaultExpanded={false} />
      <PaymentAnalytics label={`Payment Analytics for ${property.name}`} propertyId={property.id} />
      <UnitsSection property={property} />
    </div>
  );
};

export default PropertyDetailPage;