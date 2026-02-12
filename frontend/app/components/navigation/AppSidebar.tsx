'use client'

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "../LogoutButton";
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  CreditCard, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Home,
  User
} from "lucide-react"

interface AppSidebarProps {
  appUser: any
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", href: "/properties", icon: Building },
  { label: "Tenants", href: "/tenants", icon: Users },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ appUser }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);

  // Detect screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      
      // Small screens: phones (< 768px) - Hide sidebar completely, show menu button
      setIsSmallScreen(width < 768);
      
      // Medium screens: tablets (768px - 1200px) - Show collapsed sidebar with icons
      setIsMediumScreen(width >= 768 && width < 1200);
      
      // Large screens: desktop (≥ 1200px) - Show full sidebar by default
      if (width >= 1200) {
        setIsOpen(true);
      } else if (width >= 768) {
        // Medium screens: start with collapsed sidebar
        setIsOpen(false);
      } else {
        // Small screens: start with sidebar hidden
        setIsOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar when clicking a link on mobile/tablet
  const handleLinkClick = () => {
    if (isSmallScreen || isMediumScreen) {
      setIsOpen(false);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile/Tablet Menu Button */}
      {(isSmallScreen) && !isOpen && (
        <nav className="fixed z-50 w-full bg-gray-800">
          <button
            onClick={toggleSidebar}
            className="h-12 w-12 flex items-center justify-center rounded-xl shadow-2xl text-white hover:bg-gray-700 transition-all duration-300"
            aria-label="Open sidebar"
          >
            <Menu className="w-8 h-8" />
          </button>
        </nav>
      )}

      {/* Mobile/Tablet Overlay */}
      {isOpen && (isSmallScreen || isMediumScreen) && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-screen bg-gray-800 border-r border-gray-700/50 shadow-2xl z-50
        transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen 
          ? isSmallScreen
            ? "w-72 translate-x-0"
            : isMediumScreen
              ? "w-72 translate-x-0"
              : "w-72 translate-x-0"
          : isSmallScreen
            ? "w-0 -translate-x-full"
            : isMediumScreen
              ? "w-20 -translate-x-0"
              : "w-20 -translate-x-0"
        }`}
      >
        {/* Sidebar Header with Close Button on Mobile */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/50 h-20">
          {/* Logo Section - Hidden on collapsed medium screens */}
          <div 
            onClick={() => window.location.href = "/"}
            className={`flex items-center gap-3 transition-all duration-300 cursor-pointer ${
              isOpen || isSmallScreen ? "opacity-100" : "opacity-0 w-0"
            }`}
          >
            <Image
              src="/rentwise_logo.jpeg"
              alt="RentWise Logo"
              width={40}
              height={40}
              className="rounded-lg"
              unoptimized
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent whitespace-nowrap">
                RentWise
              </h1>
              <p className="text-xs text-gray-400 truncate">Property Management</p>
            </div>
          </div>
          
          {/* Close Button for Mobile/Tablet */}
          {(isSmallScreen || (isMediumScreen && isOpen)) && (
            <button 
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          {/* Collapse/Expand Button for Desktop */}
          {!isSmallScreen && !isMediumScreen && (
            <button 
              onClick={toggleSidebar}
              className={`p-2 text-gray-400 z-10 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300
                ${isOpen ? "" : ""}`}
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="px-4 py-6 h-[calc(100vh-180px)] overflow-y-auto">
          {/* Section Title - Hidden on collapsed medium screens */}
          <h2 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3 transition-opacity duration-300 ${
            isOpen || isSmallScreen ? "opacity-100" : "opacity-0"
          }`}>
            Main Menu
          </h2>
          
          <nav className="space-y-2 overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              
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
                  
                  {/* Label (shown on open sidebar or small screen) */}
                  <span className={`font-medium whitespace-nowrap transition-all duration-300 
                    ${isOpen || isSmallScreen 
                      ? "opacity-100 ml-0" 
                      : "opacity-0 w-0 absolute left-full"
                    }`}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator - hidden on collapsed medium screens */}
                  {active && (isOpen || isSmallScreen) && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                  )}
                  
                  {/* Tooltip for collapsed medium screens */}
                  {!isOpen && isMediumScreen && (
                    <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-300 z-50 shadow-lg">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer - User & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50 bg-gray-800/95 backdrop-blur-sm">
          {/* User Info - shown on open sidebar or small screen */}
          {(isOpen || isSmallScreen) && (
            <div className="mb-4 px-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{appUser.name}</p>
                  <p className="text-xs text-gray-400 truncate">{appUser.user_type.toUpperCase()} account</p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className={`flex items-center ${
            isOpen || isSmallScreen ? "gap-3" : "justify-center"
          }`}>
            <LogoutButton 
              className={`${
                isOpen || isSmallScreen 
                  ? "w-full py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-medium rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all duration-300 shadow-lg"
                  : "p-3 bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-all duration-300"
              } flex items-center ${
                isOpen || isSmallScreen ? "justify-center gap-2" : "justify-center"
              }`}
            />
            
            {/* Tooltip for collapsed medium screens */}
            {!isOpen && isMediumScreen && (
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
              ? "md:ml-72" 
              : "md:ml-20"
            : isOpen 
              ? "lg:ml-72" 
              : "lg:ml-20"
        }`}>
        {/* Your main content goes here */}
        
      </div>

      <style jsx global>{`
        
      `}</style>
    </>
  );
};

export default AppSidebar;