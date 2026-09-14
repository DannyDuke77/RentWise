'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TabHeader from "./TabHeader";
import DetailsTab from "@/app/components/units/tabs/DetailsTab";
import PaymentTab from "@/app/components/units/tabs/PaymentTab";
import ChargesTab from "@/app/components/units/tabs/ChargesTab";
import LogsTab from "@/app/components/units/tabs/LogsTab";
import ConfirmModal from "@/app/components/modals/ConfirmModal";
import { AlertTriangle, Save } from "lucide-react";
import { useUnitTenants } from "@/app/hooks/queries/useUnitDetailQueries";
import { useUpdateUnit } from "@/app/hooks/mutations/useUnitMutations";
import { useRemoveRoommate, useVacateUnit } from "@/app/hooks/mutations/useTenantMutations";
import BackButton from "@/app/components/navigation/BackButton";
import { Property } from "@/app/src/types/Types";
import { useToast } from "@/app/providers/ToastProvider";

type TabKey = 'details' | 'payments' | 'charges' | 'logs';

const VALID_TABS: TabKey[] = ['details', 'payments', 'charges', 'logs'];

interface UnitTabsSectionProps {
  unitId: string;
  initialUnit: any;
  property: any;
}

const UnitTabsSection = ({ unitId, initialUnit, property }: UnitTabsSectionProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get('tab') as TabKey | null;
  const initialTab: TabKey = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'details';

  const [currentTab, setCurrentTabState] = useState<TabKey>(initialTab);
  const [hasPendingCharges, setHasPendingCharges] = useState(false);
  const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);
  const [isRemoveRoommateModalOpen, setIsRemoveRoommateModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabKey | null;
    const nextTab: TabKey = urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'details';
    setCurrentTabState(nextTab);
  }, [searchParams]);

  const setCurrentTab = (tab: TabKey) => {
    setCurrentTabState(tab);

    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'details') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  };

  const { 
    data: tenantData, 
    refetch: refetchTenants,
    isFetching 
  } = useUnitTenants(unitId);
  const tenants = tenantData?.tenants ?? [];
  const tenancyId = tenantData?.tenancyId ?? null;

  const removeRoommate = useRemoveRoommate();
  const vacateUnit = useVacateUnit();

  const { showToast } = useToast();

  const handleOpenRemoveRoommateModal = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setIsRemoveRoommateModalOpen(true);
  };

  const handleRemoveRoommate = async () => {
    if (!selectedTenantId || !unitId || !property) return;
    try {
      await removeRoommate.mutateAsync({
        unitId,
        tenantId: selectedTenantId,
        propertyId: property.id,
      });
      showToast('Roommate Removed!', 'Roommate removed successfully', 'success');
      setIsRemoveRoommateModalOpen(false);
      setSelectedTenantId(null);
    } catch (error) {
      console.error('Failed to remove roommate:', error);
    }
  };

  const confirmRemoveTenancy = async () => {
    if (!unitId || !property) return;
    try {
      await vacateUnit.mutateAsync({
        unitId,
        propertyId: property.id,
      });
      showToast('Lease Terminated!', 'Lease terminated successfully', 'success');
      setIsVacateModalOpen(false);
    } catch (error) {
      console.error('Failed to vacate unit:', error);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton property={property as Property} label="Back to all units" />

      <div>
        <TabHeader
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          hasTenant={tenants.length > 0}
          hasPendingCharges={hasPendingCharges}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
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

        {currentTab === 'details' && (
          <DetailsTab
            property={property}
            unit={initialUnit}
            tenants={tenants}
            refetchTenants={refetchTenants}
            isFetching={isFetching}
            onRemoveRoommate={handleOpenRemoveRoommateModal}
            onRemoveTenancy={() => setIsVacateModalOpen(true)}
          />
        )}

        {currentTab === 'payments' && <PaymentTab property={property} unit={initialUnit} />}

        {currentTab === 'charges' && (
          <ChargesTab
            unit={initialUnit}
            tenancyId={tenancyId}
            onPendingStatusChange={setHasPendingCharges}
          />
        )}

        {currentTab === 'logs' && <LogsTab unitId={unitId} />}
      </div>
    </div>
  );
};

export default UnitTabsSection;