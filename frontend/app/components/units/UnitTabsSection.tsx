'use client';

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TabHeader from "./TabHeader";
import DetailsTab from "@/app/components/units/tabs/DetailsTab";
import PaymentTab from "@/app/components/units/tabs/PaymentTab";
import ChargesTab from "@/app/components/units/tabs/ChargesTab";
import LogsTab from "@/app/components/units/tabs/LogsTab";
import BackButton from "@/app/components/navigation/BackButton";
import { Property } from "@/app/src/types/Types";
import { UserPlus, UserRoundX } from "lucide-react";
import TenantModal from "../modals/TenantFormModal";

type TabKey = 'details' | 'payments' | 'charges' | 'logs';

const VALID_TABS: TabKey[] = ['details', 'payments', 'charges', 'logs'];

interface UnitTabsSectionProps {
  unitId: string;
  unit: any;
  property: any;
}

const UnitTabsSection = ({ unitId, unit, property }: UnitTabsSectionProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTenant, setModalTenant] = useState<any | null>(null);

  const tabFromUrl = searchParams.get('tab') as TabKey | null;
  const initialTab: TabKey = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'details';

  const [currentTab, setCurrentTabState] = useState<TabKey>(initialTab);

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

  const openCreate = () => { setModalTenant(null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setModalTenant(null); };
  const handleSuccess = () => closeModal();

  if (!unit) return null;

  return (
    <div className="space-y-6">
      <BackButton property={property as Property} label="Back to all units" />

      <div>
        <TabHeader
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </div>

        {unit.status !== "occupied" && currentTab !== 'logs' ? (
          <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-200 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <UserRoundX className="w-12 h-12 text-red-600 animate-bounce" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No Active Tenancy</h3>
              <p className="text-gray-400">
                Assign a tenant first to manage payments and track transactions
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Assign Tenant
            </button>
          </div>
        ) : 
          <>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              {currentTab === 'details' && (
                <DetailsTab
                  property={property}
                  unit={unit}
                />
              )}

              {currentTab === 'payments' && unit && (
                <PaymentTab 
                  property={property} 
                  unit={unit} 
                />
              )}

              {currentTab === 'charges' && unit && (
                <ChargesTab
                  unit={unit}
                  tenancyId={unit?.tenancy_id}
                />
              )}

              {currentTab === 'logs' && (
                <LogsTab unitId={unitId} />
              )}
            </div>
          </>
        }

      <TenantModal
          isOpen={isModalOpen}
          onClose={closeModal}
          tenant={modalTenant}
          unit={unit}
          onSuccess={handleSuccess}
      />
    </div>
  );
};

export default UnitTabsSection;