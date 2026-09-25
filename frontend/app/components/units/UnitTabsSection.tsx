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

  return (
    <div className="space-y-6">
      <BackButton property={property as Property} label="Back to all units" />

      <div>
        <TabHeader
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </div>

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
    </div>
  );
};

export default UnitTabsSection;