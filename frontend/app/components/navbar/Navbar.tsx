import { getAuthUser } from "@/app/lib/auth";
import PublicNavbar from "../navigation/PublicNavbar";
import AppSidebar from "../navigation/AppSidebar";

const Navbar = async () => {
    const user = await getAuthUser();

    console.log('User: ', user);
    
    if (!user) {
        return <PublicNavbar />
    }

    return <AppSidebar appUser={user} />
    
}

export default Navbar;