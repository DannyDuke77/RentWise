'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { resetAuthCookies } from '../../src/lib/actions';
import CustomTooltip from '../ui/CustomTooltip';

interface LogoutButtonProps {
    isOpen: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ isOpen }) => {
    const [isLoading, setIsLoading] = useState(false);

    const submitLogout = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await resetAuthCookies();
            const targetUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? '/';
            window.location.href = targetUrl;
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={submitLogout}
            disabled={isLoading}
            aria-label="Log out"
            className={`group relative flex items-center rounded-xl font-medium text-sm transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:opacity-60 disabled:cursor-not-allowed
                ${isOpen 
                    ? 'w-full px-3 py-2.5 bg-red-800/10 hover:bg-red-500/10 border border-slate-700/60 hover:border-red-500/30 text-slate-200 hover:text-red-400 active:scale-[0.98]' 
                    : 'w-10 h-10 justify-center bg-slate-800/40 hover:bg-red-500/10 border border-slate-700/60 hover:border-red-500/30 text-slate-200 hover:text-red-400 active:scale-95'
                }
            `}
        >
            <div className={`relative flex items-center justify-center shrink-0 rounded-lg transition-colors duration-200
                ${isOpen 
                    ? 'w-8 h-8 bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white' 
                    : 'w-full h-full text-slate-300 group-hover:text-red-400'
                }`}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                )}
            </div>

            {isOpen && (
                <span className="ml-3 truncate font-medium text-slate-200 group-hover:text-red-400 transition-colors">
                    {isLoading ? 'Logging out...' : 'Log out'}
                </span>
            )}

            {!isOpen && (
                <CustomTooltip message={isLoading ? 'Logging out...' : 'Log out'} />
            )}
        </button>
    );
};

export default LogoutButton;