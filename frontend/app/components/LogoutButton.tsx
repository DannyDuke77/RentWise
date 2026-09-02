'use client'

import { resetAuthCookies } from '../src/lib/actions';
import CustomButton from "./ui/CustomButton";

interface LogoutButtonProps {
    className?: string
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {

    const submitLogout = async() => {
        resetAuthCookies();

        window.location.href = `${process.env.NEXT_PUBLIC_MAIN_SITE_URL}`;
    }

    return(
        <CustomButton 
            label="Logout"
            onClick={submitLogout}
            className={`py-2 px-4 rounded-md ${className}`}
        />
    )
}

export default LogoutButton;