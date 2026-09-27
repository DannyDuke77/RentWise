"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Portal = "landlord" | "tenant" | "admin";

export default function PortalGate({
    portal,
    children,
}: {
    portal: Portal;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [checked, setChecked] = useState(false);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        fetch("/api/session")
            .then((res) => res.json())
            .then((data) => {
                if (data.authenticated && data.portal_access?.[portal]) {
                    setAllowed(true);
                } else {
                    router.replace("/auth/login");
                }
            })
            .finally(() => setChecked(true));
    }, [router, portal]);

    if (!checked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
        );
    }
    if (!allowed) return null;
    return <>{children}</>;
}