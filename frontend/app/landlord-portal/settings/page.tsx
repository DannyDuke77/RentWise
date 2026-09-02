"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, HandCoins, UserCircle2 } from "lucide-react";
import BusinessDetails from "./components/BusinessDetails";
import UserSettings from "./components/UserSettings";
import ChargeTypesTab from "./components/ChargeTypes";

const TABS = [
  { id: "business", label: "Business Profile", icon: Building2 },
  { id: "user", label: "User Settings", icon: UserCircle2 },
  { id: "charges", label: "Charge Types", icon: HandCoins },
];

const SettingsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Get the active tab directly from the URL
  const activeTab = searchParams.get("tab") || "business";

  // 2. Function to update the tab by updating the URL
  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/settings?${params.toString()}`, { scroll: false });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "business": return <BusinessDetails />;
      case "user": return <UserSettings />;
      case "charges": return <ChargeTypesTab />;
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
        <div className="flex space-x-1 border-b border-gray-200 mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
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

        {/* Tab content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;