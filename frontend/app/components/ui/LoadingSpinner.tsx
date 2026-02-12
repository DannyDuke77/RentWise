'use client';

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    label?: string;
    fullPage?: boolean;
}

const LoadingSpinner = ({ 
    size = 'md', 
    color = 'blue-600', 
    label = 'Loading unit details...',
    fullPage = false 
}: LoadingSpinnerProps) => {
    
    // Size Mapping
    const sizes = {
        sm: 'h-6 w-6 border-2',
        md: 'h-10 w-10 border-3',
        lg: 'h-16 w-16 border-[4px]',
        xl: 'h-24 w-24 border-[6px]'
    };

    const spinnerContent = (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
                {/* Outer Ring (Static Track) */}
                <div className={`${sizes[size]} rounded-full border-gray-100`}></div>
                
                {/* Inner Spinning Ring */}
                <div className={`absolute top-0 left-0 ${sizes[size]} rounded-full border-t-${color} border-r-transparent border-b-transparent border-l-transparent animate-spin duration-700`}></div>
                
                {/* Pulse Effect (The "Cool" Part) */}
                <div className={`absolute top-0 left-0 ${sizes[size]} rounded-full border-${color} opacity-20 animate-ping`}></div>
            </div>
            
            {label && (
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">
                    {label}
                </p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md">
                {spinnerContent}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12 w-full">
            {spinnerContent}
        </div>
    );
};

export default LoadingSpinner;