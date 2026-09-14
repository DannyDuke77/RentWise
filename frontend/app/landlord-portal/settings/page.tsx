"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, HandCoins, UserCircle2, Users, Smartphone } from "lucide-react";
import BusinessDetails from "./components/BusinessDetails";
import TeamTab from "./components/Team";
import UserSettings from "./components/UserSettings";
import ChargeTypesTab from "./components/ChargeTypes";
import MpesaSettings from "./components/MpesaSettings";

const TABS = [
  { id: "business", label: "Business Details", icon: Building2 },
  { id: "team", label: "Team Management", icon: Users },
  { id: "charges", label: "Charge Types", icon: HandCoins },
  { id: "mpesa", label: "Mpesa Settings", icon: Smartphone },
  { id: "user", label: "User Settings (You)", icon: UserCircle2 },
];

const SettingsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get("tab") || "business";

  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/settings?${params.toString()}`, { scroll: false });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "business": return <BusinessDetails />;
      case "team": return <TeamTab />;
      case "charges": return <ChargeTypesTab />;
      case "mpesa": return <MpesaSettings />;
      case "user": return <UserSettings />;
      default: return <BusinessDetails />;
    }
  };


  return (
    <div className="min-h-screen bg-gray-50/50 py-6 px-4">
      <div className="mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-1">Manage your business profile and personal preferences.</p>
        </header>

        {/* Tabs */}
        <div className="relative border-b border-gray-200 mb-8">
          <div className="flex space-x-1 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-none [-ms-overflow-style:none] [supports(scrollbar-width:none)]:scrollbar-none [&::-webkit-scrollbar]:hidden px-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabRef : undefined}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-4 -mb-px shrink-0 ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-0 sm:p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;