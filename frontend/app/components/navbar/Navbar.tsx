import { headers } from "next/headers";
import { getAuthUser } from "@/app/src/lib/auth";
import PublicNavbar from "./PublicNavbar";
import Sidebar from "./Sidebar";

const Navbar = async () => {
    const user = await getAuthUser();

    if (!user) {
        return <PublicNavbar />;
    }

    const hostname = (await headers()).get("host");

    const portal =
        hostname === process.env.NEXT_PUBLIC_LANDLORD_PORTAL_HOST
            ? "landlord"
            : hostname === process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST
                ? "admin"
                : "tenant";

    return <Sidebar appUser={user} portal={portal} />;
};

export default Navbar;