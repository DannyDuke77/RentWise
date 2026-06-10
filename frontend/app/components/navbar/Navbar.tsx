import { getAuthUser } from "@/app/lib/auth";
import PublicNavbar from "../navigation/PublicNavbar";
import AppSidebar from "../navigation/AppSidebar";

const Navbar = async () => {
    const user = await getAuthUser();
    
    if (!user) {
        return <PublicNavbar />
    }

    return <AppSidebar appUser={user} />
    
}

export default Navbar;