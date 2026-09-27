import PortalGate from "@/app/components/gates/PortalGate";

export default function TenantPortalLayout({ children }: { children: React.ReactNode }) {
    return <PortalGate portal="tenant">{children}</PortalGate>;
}