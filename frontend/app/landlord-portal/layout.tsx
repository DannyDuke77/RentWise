import PortalGate from "@/app/components/gates/PortalGate";
import BusinessGate from "@/app/components/gates/BusinessGate";

export default function LandlordPortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <PortalGate portal="landlord">
            <BusinessGate>{children}</BusinessGate>
        </PortalGate>
    );
}