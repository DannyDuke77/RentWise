'use client';

import { useState } from "react";

interface CustomButtonProps {
    label: string;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    loading?: boolean
}

const CustomButton: React.FC<CustomButtonProps> = ({
    label, 
    className, 
    onClick,
    loading=false
}) => {

    return(
        <button 
            onClick={onClick}
            disabled={loading}
            className={`cursor-pointer min-w-[120px] rounded-xl ${className} ${
                loading ? "opacity-60 cursor-not-allowed flex items-center justify-center" : "duration-300"
            }`}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Loading…
                </span>
            ) : (
                label
            )}
        </button>
    )
}

export default CustomButton;