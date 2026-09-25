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
    const [isLandlordPortal, setIsLandlordPortal] = useState<boolean | null>(null);

    useEffect(() => {
        setIsLandlordPortal(
            window.location.hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST
        );
    }, []);

    const isAuthRoute = pathname.startsWith("/auth");
    const shouldFetchBusinesses = isLandlordPortal === true && !isAuthRoute;

    const { data, isLoading: isBusinessesLoading } = useBusinesses(shouldFetchBusinesses);

    const businesses = useMemo(() => {
        if (Array.isArray(data)) return data;
        return data?.results ?? [];
    }, [data]);

    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(() =>
        typeof window !== "undefined" ? localStorage.getItem("activeBusinessId") : null
    );

    const activeBusinessId = useMemo(() => {
        if (!businesses.length) return null;
        if (selectedBusinessId && businesses.some((b: any) => b.id === selectedBusinessId)) {
        return selectedBusinessId;
        }
        return businesses[0].id;
    }, [businesses, selectedBusinessId]);

    const activeBusiness = businesses.find((b: any) => b.id === activeBusinessId) ?? null;
    const activeBusinessRole = activeBusiness?.membership_role ?? null;

    useEffect(() => {
        setApiBusinessId(activeBusinessId);
    }, [activeBusinessId]);

     useEffect(() => {
        if (activeBusinessId) {
            localStorage.setItem("activeBusinessId", activeBusinessId);
        }
    }, [activeBusinessId]);

    const isLoading = isLandlordPortal === null || (shouldFetchBusinesses && isBusinessesLoading);

    return (
        <BusinessContext.Provider
            value={{
                businesses,
                activeBusiness,
                activeBusinessId,
                activeBusinessRole,
                setActiveBusinessId: setSelectedBusinessId,
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