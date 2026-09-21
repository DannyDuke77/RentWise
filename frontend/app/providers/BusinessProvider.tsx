"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { setApiBusinessId } from "@/app/services/apiService";
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

export function BusinessProvider({ children }: { children: React.ReactNode }) {
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

    // Stable reference — new array identity only when `data` changes
    const businesses = useMemo(() => {
        if (Array.isArray(data)) return data;
        return data?.results ?? [];
    }, [data]);

    const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);

    const activeBusiness = businesses.find((b: any) => b.id === activeBusinessId) ?? null;

    useEffect(() => {
        setApiBusinessId(activeBusinessId);
    }, [activeBusinessId]);

    const activeBusinessRole = activeBusiness?.membership_role ?? null;

    // Reconciliation effect — no `activeBusinessId` in deps
    useEffect(() => {
        if (!businesses.length) return;

        setActiveBusinessId((current) => {
            // Keep the current selection if it still exists
            if (current && businesses.some((b: any) => b.id === current)) {
                return current;
            }

            // Try the saved ID
            const savedBusinessId = localStorage.getItem("activeBusinessId");
            if (
                savedBusinessId &&
                businesses.some((b: any) => b.id === savedBusinessId)
            ) {
                return savedBusinessId;
            }

            // Fall back to the first
            return businesses[0].id;
        });
    }, [businesses]);

    // Persist selection
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