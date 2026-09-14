'use client'

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import LogoutButton from "../LogoutButton";
import { useBusiness } from "@/app/providers/BusinessProvider";
import { useToast } from "@/app/providers/ToastProvider";
import {
  LayoutDashboard, Building, Users, CreditCard, Settings,
  ChevronLeft, ChevronDown, Menu, X, User, HandCoins, PanelLeftClose, PanelLeftOpen
} from "lucide-react"
import { Business } from "@/app/src/types/Types";

interface SidebarProps {
  appUser: any,
  portal: "landlord" | "tenant" | "admin",
}

const LandlordNavItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Properties", href: "/properties", icon: Building },
  { label: "Tenants", href: "/tenants", icon: Users },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Charges", href: "/charges", icon: HandCoins },
  { label: "Settings", href: "/settings", icon: Settings },
];

const TenantNavItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Payments", href: "/payments", icon: CreditCard },
];

const AdminNavItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
];

const PORTAL_LABELS = {
  tenant: "TENANT",
  admin: "ADMIN",
} as const;

const Sidebar: React.FC<SidebarProps> = ({ appUser, portal }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);

  const {
    businesses,
    activeBusiness,
    activeBusinessId,
    activeBusinessRole,
    setActiveBusinessId,
    isLoading,
  } = useBusiness();

  const navItems =
    portal === "landlord"
      ? LandlordNavItems
      : portal === "admin"
        ? AdminNavItems
        : TenantNavItems;

  const roleLabel =
    portal === "landlord"
      ? activeBusinessRole?.toUpperCase() ?? null
      : PORTAL_LABELS[portal] ?? null;

  // Detect screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsSmallScreen(width < 768);
      setIsMediumScreen(width >= 768 && width < 1200);
      if (width >= 1200) setIsOpen(true);
      else setIsOpen(false);
    };
    checkScreenSize();
    setHasMounted(true);
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSmallScreen && isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isSmallScreen, isOpen]);

  const handleLinkClick = () => {
    if (isSmallScreen || isMediumScreen) {
      setIsOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleSwitchBusiness = (business: Business) => {
    setActiveBusinessId(business.id);
    setBusinessMenuOpen(false);
    
    if (isSmallScreen || isMediumScreen) {
      setIsOpen(false);
    }

    if (pathname.includes('/properties') || pathname.includes('/units')) {
      router.push('/properties');
    }

    showToast('Business Switched', `You have switched to ${business.company_name}.`, 'success');
  };

  const sidebarWidth = isOpen
  ? "w-80 translate-x-0"
  : isSmallScreen
    ? "w-0 -translate-x-full"
    : "w-20 translate-x-0";

  return (
    <>
      {/* Mobile Menu Button */}
      {(isSmallScreen) && !isOpen && (
        <nav className="fixed top-0 left-0 w-full z-40 bg-gray-800">
          <button
            onClick={toggleSidebar}
            className="h-16 w-16 flex items-center justify-center text-white hover:bg-gray-700 transition-all duration-300"
            aria-label="Open sidebar"
          >
            <Menu className="w-8 h-8" />
          </button>
        </nav>
      )}

      {/* Mobile Overlay */}
      {isOpen && (isSmallScreen || isMediumScreen) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container
          - flex column layout so header + footer are fixed height and nav scrolls
          - uses h-[100dvh] on mobile for correct viewport height (accounts for browser chrome)
      */}
      <aside
        className={`fixed top-0 left-0 h-screen h-[100dvh] bg-gray-800 border-r border-gray-700/50 shadow-2xl z-50
          flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out ${sidebarWidth}`}
      >
        {/* ===== HEADER (shrink-0) ===== */}
        <div className="shrink-0 border-b border-gray-700/50 bg-gray-800/80">
          <div className="flex items-center justify-between px-6 py-5">
            {/* Logo Section - Hidden on collapsed medium screens */}
            <Link
              href="/"
              className={`flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                isOpen || isSmallScreen ? "opacity-100" : "opacity-0 w-0"
              }`}
            >
              <Image
                src="/rentwise_logo.jpeg"
                alt="RentWise Logo"
                width={40}
                height={40}
                className="rounded-lg shadow-md"
                unoptimized
              />
              <div className="min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent whitespace-nowrap">
                  RentWise
                </h1>
                <p className="text-xs text-gray-400 truncate">Property Management</p>
              </div>
            </Link>

            {/* Close Button for Mobile/Tablet */}
            {isSmallScreen && (
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Collapse/Expand Button for Desktop */}
            {!isSmallScreen && (
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-400 z-10 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300"
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </button>
            )}
          </div>

          {/* Business Selector Section */}
          {(isOpen && portal === 'landlord') && (
            <div className="px-4 pb-6">
              {isLoading ? (
                <div className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700/60">
                  <div className="p-2 rounded-lg bg-gray-700/50 shrink-0">
                    <Building className="w-4 h-4 text-gray-500 animate-pulse" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-2 w-20 bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => {
                      if (businesses.length > 1) {
                        setBusinessMenuOpen(!businessMenuOpen);
                      }
                    }}
                    disabled={businesses.length <= 1}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700/60 text-left ${
                      businesses.length > 1
                        ? "hover:bg-gray-700/50 hover:border-blue-500/40 cursor-pointer shadow-sm"
                        : "cursor-default"
                    } transition-all duration-200 group`}
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors shrink-0">
                      <Building className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Active Business
                      </p>
                      <p className="text-sm font-semibold text-white truncate">
                        {activeBusiness?.company_name}
                      </p>
                    </div>

                    {businesses.length > 1 && (
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                          businessMenuOpen ? "rotate-180 text-blue-400" : ""
                        }`}
                      />
                    )}
                  </button>

                  {businessMenuOpen && businesses.length > 1 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-gray-700/50 animate-fadeIn">
                      <div className="px-3 py-2 bg-gray-900/40 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Switch Business
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {businesses.map((business: any) => (
                          <button
                            key={business.id}
                            onClick={() => handleSwitchBusiness(business)}
                            className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                              business.id === activeBusinessId
                                ? "bg-blue-600/15 text-blue-400 font-medium"
                                : "hover:bg-gray-700/60 text-white"
                            }`}
                          >
                            <Building className={`w-4 h-4 shrink-0 ${business.id === activeBusinessId ? "text-blue-400" : "text-gray-400"}`} />
                            <span className="text-sm truncate flex-1">
                              {business.company_name}
                            </span>
                            {business.id === activeBusinessId && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== NAV (flex-1, scrollable) ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-6">
          {/* Section Title */}
          <div className={`flex items-center justify-between mb-4 px-3 transition-all duration-300 ${
            isOpen || isSmallScreen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em]">
                Main Menu
              </h2>
            </div>

            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
            >
              <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
          </div>

          <nav className="space-y-2 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === '/'
                ? pathname === '/' || pathname === '/landlord-portal'
                : pathname.startsWith(item.href) || pathname.startsWith(`/landlord-portal${item.href}`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center ${
                    isOpen || isSmallScreen
                      ? "justify-start gap-3 px-4"
                      : "justify-center px-2"
                  } py-3 rounded-xl transition-all duration-300 group relative
                  ${active
                    ? "bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  {/* Icon Container */}
                  <div className={`p-2 rounded-lg ${active ? 'bg-blue-600/20' : 'bg-gray-700/30'}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Label */}
                  <span className={`font-medium whitespace-nowrap transition-all duration-300
                    ${isOpen
                      ? "opacity-100 ml-0"
                      : "opacity-0 w-0 absolute left-full"
                    }`}>
                    {item.label}
                  </span>

                  {/* Active indicator */}
                  {active && isOpen && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                  )}

                  {/* Tooltip for collapsed sidebar */}
                  {!isOpen && (
                    <span className="absolute top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-300 z-50 shadow-lg">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ===== FOOTER (shrink-0, pinned) ===== */}
        <div className="shrink-0 border-t border-gray-700/50 bg-gray-800/95 backdrop-blur-sm p-4">
          {/* User Info */}
          {isOpen && (
            <div className="mb-4 px-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{appUser.name}</p>
                  {roleLabel && (
                    <p className="text-xs text-gray-400 truncate">
                      {`${roleLabel} account`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className={`flex items-center ${
            isOpen ? "gap-3" : "justify-center"
          }`}>
            <LogoutButton
              className={`${
                isOpen
                  ? "w-full py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-medium rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all duration-300 shadow-lg"
                  : "p-3 bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-all duration-300"
              } flex items-center ${
                isOpen ? "justify-center gap-2" : "justify-center"
              }`}
            />

            {/* Tooltip for collapsed sidebar */}
            {!isOpen && (
              <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-300 z-50 shadow-lg">
                Sign Out
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Content Area Padding */}
      <div className={`transition-all duration-300 ease-in-out min-h-screen
        ${isSmallScreen
          ? "ml-0"
          : isMediumScreen
            ? isOpen
              ? "md:ml-80"
              : "md:ml-20"
            : isOpen
              ? "lg:ml-80"
              : "lg:ml-20"
        }`}>
        {/* Main content */}
      </div>
    </>
  );
};

export default Sidebar;