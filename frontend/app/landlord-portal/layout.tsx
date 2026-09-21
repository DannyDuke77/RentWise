import BusinessGate from "@/app/components/business/BusinessGate";

export default function LandlordPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BusinessGate>{children}</BusinessGate>;
}