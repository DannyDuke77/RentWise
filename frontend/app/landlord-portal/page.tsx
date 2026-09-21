import { redirect } from "next/navigation";
import { getPortalAccess } from "@/app/src/lib/portal";
import LandlordDashboard from "@/app/components/landlord-portal/LandlordDashboard";

export default async function LandlordPortalPage() {
  const access = await getPortalAccess();

  if (!access.landlord) {
    redirect("/onboarding/business");
  }

  return <LandlordDashboard />;
}