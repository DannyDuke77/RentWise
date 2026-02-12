'use client';

import { useState } from "react";
import { Menu, X, Home, HelpCircle, LogIn, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const PublicNavbar = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-2xl">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center group hover:scale-105 transition-all duration-300">
                            <div className="relative">
                                <Image
                                    src="/RentWise_logo.png"
                                    alt="RentWise Logo"
                                    width={64}
                                    height={64}
                                    className=""
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                    RentWise
                                </span>
                                <span className="text-xs text-gray-400 -mt-1">Property Management</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            <Link 
                                href="/support" 
                                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-300 group"
                            >
                                <HelpCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                <span>Help & Support</span>
                            </Link>
                            
                            <div className="h-6 w-px bg-gray-700 mx-2"></div>
                            
                            <Link 
                                href="/auth/login" 
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Sign In</span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="md:hidden p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:bg-gray-750 transition-all duration-300"
                            aria-label="Toggle menu"
                        >
                            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div 
                className={`fixed top-0 right-0 h-screen w-72 bg-gray-900/95 backdrop-blur-sm shadow-2xl border-l border-gray-800 z-40 transition-all duration-300 ease-in-out transform
                ${open ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                        <Image
                            src="/rentwise_logo.jpeg"
                            alt="RentWise Logo"
                            width={40}
                            height={40}
                            className="rounded-xl"
                        />
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            RentWise
                        </span>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mobile Menu Items */}
                <div className="p-6">
                    <div className="space-y-2">
                        <Link 
                            onClick={() => setOpen(false)}
                            href="/support"
                            className="flex items-center gap-3 px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 group transition-all duration-300"
                        >
                            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg">
                                <HelpCircle className="w-5 h-5 text-cyan-400" />
                            </div>
                            <span className="text-white font-medium">Help & Support</span>
                            <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                        </Link>
                    </div>

                    {/* Sign In Button for Mobile */}
                    <div className="mt-8 pt-6 border-t border-gray-800">
                        <Link 
                            onClick={() => setOpen(false)}
                            href="/auth/login"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group"
                        >
                            <LogIn className="w-5 h-5" />
                            <span>Sign In to Account</span>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                        
                        <p className="text-center text-gray-500 text-xs mt-4">
                            New to RentWise?{" "}
                            <Link 
                                href="/auth/register" 
                                onClick={() => setOpen(false)}
                                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>

                    {/* Decorative Element */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="text-center text-xs text-gray-500">
                            © 2024 RentWise. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {open && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 animate-fadeIn"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
};

export default PublicNavbar;