import { headers } from "next/headers";
import { getAuthUser } from "@/app/src/lib/auth";
import { getAccessToken, getPortalAccess } from "@/app/src/lib/actions";
import PublicNavbar from "./PublicNavbar";
import Sidebar from "./Sidebar";

const Navbar = async () => {
    const user = await getAuthUser();
    const hostname = (await headers()).get("host")?.split(":")[0];

    const portal =
        hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST ? "landlord"
        : hostname === process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ? "admin"
        : "tenant";

    const isExcludedHost = hostname === process.env.NEXT_PUBLIC_MAIN_SITE_HOST;

    if (!user || isExcludedHost) {
        return <PublicNavbar />;
    }

    const portalAccess = await getPortalAccess();
    if (!portalAccess?.[portal]) {
        return <PublicNavbar />;
    }

    return <Sidebar appUser={user} portal={portal} isExcludedHost={isExcludedHost} />;
};

export default Navbar;