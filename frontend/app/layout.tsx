import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "./components/navbar/Navbar";
import Footer from "./components/ui/Footer";
import UnitModal from "./components/modals/UnitModal";
import UnitDetailModal from "./components/modals/UnitDetailModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RentWise - Smart Property Management",
  description: "RentWise is a modern property management application built with Django and Next.js, designed to streamline rental operations and enhance landlord experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          <Navbar />

          {/* Main content */}
          <main className="flex-1 md:mt-0">
            {children}
            
          </main>
          
          {/* Modals */}
          <UnitModal /> 
          <UnitDetailModal />
        </div>
      </body>
    </html>
  );
}
