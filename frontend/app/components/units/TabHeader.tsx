'use client';

import { useRef, useEffect } from "react";
import {
    Home, UserPlus, CreditCard, Clock,
    Plus, Receipt
} from "lucide-react";

interface TabHeaderProps {
    currentTab: 'details' | 'payments' | 'charges' | 'logs';
    setCurrentTab: (tab: 'details' | 'payments' | 'charges' | 'logs') => void;
}

const TabHeader = ({ currentTab, setCurrentTab }: TabHeaderProps) => {
    const tabs = [
        {
            id: 'details' as const,
            label: 'Unit Details',
            icon: Home,
            show: true,
        },
        {
            id: 'payments' as const,
            label: 'Payment',
            icon: CreditCard,
            show: true,
        },
        {
            id: 'charges' as const,
            label: 'Charges',
            icon: Receipt,
            show: true,
        },
        {
            id: 'logs' as const,
            label: 'Logs',
            icon: Clock,
            show: true,
        },
    ];

    const visibleTabs = tabs.filter(tab => tab.show !== false);

    // Scroll active tab into view (matches SettingsPage behavior)
    const activeTabRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        activeTabRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });
    }, [currentTab]);

    return (
        <div className="border-b border-gray-200 bg-white shadow-sm">
            <div className="px-1">
                {/* Scrollable tab buttons */}
                <div className="flex gap-4 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-none [-ms-overflow-style:none] [supports(scrollbar-width:none)]:scrollbar-none [&::-webkit-scrollbar]:hidden">
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                ref={isActive ? activeTabRef : undefined}
                                onClick={() => setCurrentTab(tab.id)}
                                className={`group relative flex items-center gap-2 px-5 sm:px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 ${
                                    isActive
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                {Icon && (
                                    <Icon
                                        size={18}
                                        className={`transition-transform ${
                                            isActive ? "scale-105" : "group-hover:scale-105"
                                        }`}
                                    />
                                )}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TabHeader;