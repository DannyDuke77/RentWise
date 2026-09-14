"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useBusinesses } from "@/app/hooks/queries/useBusinessQueries";

interface BusinessContextType {
    businesses: any[];
    activeBusiness: any | null;
    activeBusinessId: string | null;
    activeBusinessRole: string | null;
    setActiveBusinessId: (businessId: string) => void;
    isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(
    undefined
);

export function BusinessProvider({ children, }: { children: React.ReactNode; }) {
    const pathname = usePathname();
    const [isLandlordPortal, setIsLandlordPortal] = useState(false);

    useEffect(() => {
        setIsLandlordPortal(
            window.location.hostname ===
            process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST
        );
    }, []);

    const isAuthRoute = pathname.startsWith("/auth");

    const shouldFetchBusinesses = isLandlordPortal && !isAuthRoute;

    const { data, isLoading } = useBusinesses(shouldFetchBusinesses);
    const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);

    const businesses = Array.isArray(data) ? data : data?.results ?? [];

    const activeBusiness =
        businesses.find(
            (business: any) => business.id === activeBusinessId
        ) ?? null;

    const activeBusinessRole = activeBusiness?.membership_role ?? null;

    useEffect(() => {
        if (!businesses.length) return;

        const savedBusinessId = localStorage.getItem("activeBusinessId");

        if (savedBusinessId && businesses.some((business: any) => business.id === savedBusinessId)) {
            setActiveBusinessId(savedBusinessId);
            return;
        }

        if (businesses.length === 1) {
            setActiveBusinessId(businesses[0].id);
        }
    }, [businesses]);

    useEffect(() => {
        if (activeBusinessId) {
            localStorage.setItem("activeBusinessId", activeBusinessId);
        }
    }, [activeBusinessId]);

    return (
        <BusinessContext.Provider
            value={{
                businesses,
                activeBusiness,
                activeBusinessId,
                activeBusinessRole,
                setActiveBusinessId,
                isLoading,
            }}
        >
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const context = useContext(BusinessContext);

    if (!context) {
        throw new Error(
            "useBusiness must be used within a BusinessProvider"
        );
    }

    return context;
}