'use client';

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    Menu,
    X,
    HelpCircle,
    ChevronRight,
    Building2,
    UserRound,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const baseUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || '';
const landlordPortalUrl = process.env.NEXT_PUBLIC_LANDLORD_PORTAL_URL || '';
const tenantPortalUrl = process.env.NEXT_PUBLIC_TENANT_PORTAL_URL || '';

const EXCLUDED_PATHS = ['/accept-invitation', '/auth/register'];

const PublicNavbar = () => {
    const path = usePathname();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [open]);

    if (EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))) {
        return null;
    }

    return (
        <>
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b-2 border-gray-200 ${
                scrolled
                    ? "bg-white/95 backdrop-blur-sm shadow-md"
                    : "bg-white/90 backdrop-blur-sm"
            }`}>
                <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 lg:h-20">

                        {/* Logo */}
                        <Link href={baseUrl} className="flex items-center gap-3 group">
                            <Image
                                src="/RentWise_logo.png"
                                alt="RentWise Logo"
                                width={40}
                                height={40}
                                className="rounded-lg w-12 h-12 bg-slate-800"
                            />
                            <div className="flex flex-col">
                                <span className="text-xl lg:text-2xl font-bold text-gray-900">
                                    RentWise
                                </span>
                                <span className="text-xs text-gray-500 -mt-0.5">Property Management</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-1">
                            <Link
                                href={baseUrl + "/support"}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition text-sm"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span>Help & Support</span>
                            </Link>

                            <div className="h-10 w-px bg-gray-300 mx-1" />

                            <Link
                                href={tenantPortalUrl}
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white hover:bg-emerald-600 font-medium rounded-md transition text-sm"
                            >
                                <UserRound className="w-4 h-4" />
                                <span>Tenant Portal</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>

                            <Link
                                href={landlordPortalUrl}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition shadow-sm hover:shadow"
                            >
                                <Building2 className="w-4 h-4" />
                                <span>Landlord Portal</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                        >
                            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed top-0 right-0 h-screen w-full sm:w-80 bg-white shadow-xl z-40 transition-transform duration-300 ease-in-out ${
                open ? "translate-x-0" : "translate-x-full"
            }`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Image src="/rentwise_logo.jpeg" alt="RentWise" width={36} height={36} className="rounded-lg" />
                        <span className="text-xl font-bold text-gray-900">RentWise</span>
                    </div>
                    <button 
                        onClick={() => setOpen(false)} 
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="p-6 space-y-2">
                    <Link
                        href={landlordPortalUrl}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition group"
                    >
                        <div className="p-1.5 bg-white/20 rounded">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-medium">Landlord Portal</span>
                        <ChevronRight className="w-4 h-4 text-white/70 ml-auto" />
                    </Link>

                    <Link
                        href={tenantPortalUrl}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition group"
                    >
                        <div className="p-1.5 bg-emerald-50 rounded">
                            <UserRound className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Tenant Portal</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                    </Link>

                    <Link
                        href={baseUrl + "/support"}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition group"
                    >
                        <div className="p-1.5 bg-gray-100 rounded">
                            <HelpCircle className="w-5 h-5 text-gray-500" />
                        </div>
                        <span className="text-gray-700 font-medium">Help & Support</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                    </Link>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50">
                    <p className="text-center text-xs text-gray-500">© 2026 RentWise. All rights reserved.</p>
                </div>
            </div>

            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 z-30"
                    onClick={() => setOpen(false)}
                />
            )}
        </>
    );
};

export default PublicNavbar;