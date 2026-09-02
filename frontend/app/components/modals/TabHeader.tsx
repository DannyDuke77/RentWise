'use client';

import { 
    Home, UserPlus, CreditCard, FileText, Clock,
    Users, Plus, Receipt, AlertCircle
} from "lucide-react";

interface TabHeaderProps {
    currentTab: 'details' | 'tenant-form' | 'payment' | 'charges' | 'logs';
    setCurrentTab: (tab: 'details' | 'tenant-form' | 'payment' | 'charges' | 'logs') => void;
    hasTenant: boolean;
    hasPendingCharges?: boolean;
}

const TabHeader = ({ currentTab, setCurrentTab, hasTenant, hasPendingCharges }: TabHeaderProps) => {
    const tabs = [
        {
            id: 'details' as const,
            label: 'Unit Details',
            icon: Home,
            show: true,
        },
        {
            id: 'tenant-form' as const,
            label: hasTenant ? 'Add Roommate' : 'Assign Tenant',
            icon: hasTenant ? UserPlus : Plus,
            show: true,
        },
        {
            id: 'payment' as const,
            label: 'Payment',
            icon: CreditCard,
            show: true,
        },
        {
            id: 'charges' as const,
            label: 'Charges',
            icon: Receipt,
            show: true,
            hasBadge: hasPendingCharges,
        },
        {
            id: 'logs' as const,
            label: 'Logs',
            icon: Clock,
            show: true,
        },
    ];

    const visibleTabs = tabs.filter(tab => tab.show !== false);

    return (
        <div className="px-1 py-2 flex border-b border-gray-200 shadow-lg bg-white">
            {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                
                return (
                    <button
                        key={tab.id}
                        className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                            isActive 
                                ? 'text-blue-600' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setCurrentTab(tab.id)}
                    >
                        <span className="inline-flex items-center gap-2">
                            {Icon && <Icon className="w-4 h-4" />}
                            {tab.label}
                            {tab.hasBadge && (
                                <span className="relative flex h-3 w-3 items-center justify-center">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                </span>
                            )}
                        </span>
                        {isActive && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default TabHeader;