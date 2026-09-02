'use client';

import React, { useState, useEffect } from "react";
import TabHeader from "../modals/TabHeader";
import DetailsTab from "@/app/landlord-portal/properties/[propertyId]/units/[unitId]/tabs/DetailsTab";
import TenantAssignmentForm from "@/app/landlord-portal/properties/[propertyId]/units/[unitId]/tabs/TenantAssignmentForm";
import PaymentTab from "@/app/landlord-portal/properties/[propertyId]/units/[unitId]/tabs/PaymentTab";
import ChargesTab from "@/app/landlord-portal/properties/[propertyId]/units/[unitId]/tabs/ChargesTab";
import LogsTab from "@/app/landlord-portal/properties/[propertyId]/units/[unitId]/tabs/LogsTab";
import ConfirmModal from "@/app/components/modals/ConfirmModal";
import { AlertTriangle, Save } from "lucide-react";
import { useUnitTenants } from "@/app/hooks/queries/useUnitDetailQueries";
import { useRemoveRoommate, useVacateUnit, useUpdateUnit } from "@/app/hooks/mutations/useUnitMutations";
import BackButton from "@/app/components/navigation/BackButton";
import { Property } from "@/app/src/types/Types";

interface UnitTabsSectionProps {
  unitId: string;
  initialUnit: any;
  property: any;
}

const UnitTabsSection = ({ unitId, initialUnit, property }: UnitTabsSectionProps) => {
  const [currentTab, setCurrentTab] = useState<'details' | 'tenant-form' | 'payment' | 'charges' | 'logs'>('details');
  const [hasPendingCharges, setHasPendingCharges] = useState(false);
  const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);
  const [isRemoveRoommateModalOpen, setIsRemoveRoommateModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const { 
    data: tenantData, 
    refetch: refetchTenants,
    isLoading: loadingTenants 
  } = useUnitTenants(unitId);
  const tenants = tenantData?.tenants ?? [];
  const tenancyId = tenantData?.tenancyId ?? null;

  const removeRoommate = useRemoveRoommate(unitId);
  const vacateUnit = useVacateUnit(unitId);

  const handleOpenRemoveRoommateModal = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setIsRemoveRoommateModalOpen(true);
  };

  const handleRemoveRoommate = async () => {
    if (!selectedTenantId) return;
    await removeRoommate.mutateAsync(selectedTenantId);
    setIsRemoveRoommateModalOpen(false);
    setSelectedTenantId(null);
    refetchTenants();
  };

  const confirmRemoveTenancy = async () => {
    await vacateUnit.mutateAsync();
    setIsVacateModalOpen(false);
    refetchTenants();
  };

  return (
    <div className="space-y-6">
      <BackButton property={property as Property} label="Back to all units" />
      
      <div className="">
          <TabHeader
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              hasTenant={tenants.length > 0}
              hasPendingCharges={hasPendingCharges}
          />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        {/* Modals */}
        <ConfirmModal
          isOpen={isVacateModalOpen}
          icon={<AlertTriangle size={24} className="text-red-500" />}
          title="Terminate Lease?"
          message="This will end the lease and remove all tenants from this unit."
          message2="If you only want to remove one tenant, use the 'Remove Tenant' button on their card instead."
          confirmText="Terminate Lease"
          isLoading={vacateUnit.isPending}
          onConfirm={confirmRemoveTenancy}
          onClose={() => setIsVacateModalOpen(false)}
        />

        <ConfirmModal
          isOpen={isRemoveRoommateModalOpen}
          icon={<AlertTriangle size={24} className="text-red-500" />}
          title="Remove Tenant?"
          message="Are you sure you want to remove this tenant from this unit?"
          message2="This action cannot be undone."
          confirmText="Remove Tenant"
          isLoading={removeRoommate.isPending}
          onConfirm={handleRemoveRoommate}
          onClose={() => {
            setIsRemoveRoommateModalOpen(false);
            setSelectedTenantId(null);
          }}
        />

        {/* Main Tab Content Card */}
        {currentTab === 'details' && (
            <DetailsTab
              property={property}
              unit={initialUnit}
              tenants={tenants}
              refetchTenants={refetchTenants}
              loading={loadingTenants}
              onRemoveRoommate={handleOpenRemoveRoommateModal}
              onRemoveTenancy={() => setIsVacateModalOpen(true)}
              onAssignClick={() => setCurrentTab('tenant-form')}
            />
        )}

        {currentTab === 'tenant-form' && (
          <TenantAssignmentForm
            unit={initialUnit}
            tenancyId={tenancyId || undefined}
            onSuccess={() => {
              setCurrentTab('details');
              refetchTenants();
            }}
            hasTenant={tenants && tenants.length > 0}
          />
        )}

        {currentTab === 'payment' && <PaymentTab property={property} unit={initialUnit} />}

        {currentTab === 'charges' && (
          <ChargesTab
            unit={initialUnit}
            tenancyId={tenancyId}
            onPendingStatusChange={setHasPendingCharges}
          />
        )}

        {currentTab === 'logs' && <LogsTab unit={initialUnit} loading={loadingTenants} />}
      </div>
    </div>
  );
};

export default UnitTabsSection;