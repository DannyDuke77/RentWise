'use client'

import { useRouter } from "next/navigation"

import { resetAuthCookies } from '../lib/actions';
import CustomButton from "./ui/CustomButton";

interface LogoutButtonProps {
    className?: string
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
    const router = useRouter();

    const submitLogout = async() => {
        resetAuthCookies();

        router.push('/')
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