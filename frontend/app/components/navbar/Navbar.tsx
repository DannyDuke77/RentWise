import { getAuthUser } from "@/app/src/lib/auth";
import PublicNavbar from "./PublicNavbar";
import Sidebar from "./Sidebar";

const Navbar = async () => {
    const user = await getAuthUser();
    
    if (!user) {
        return <PublicNavbar />
    }

    return <Sidebar appUser={user} />
    
}

export default Navbar;