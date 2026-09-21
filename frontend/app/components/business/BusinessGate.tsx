"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Layers,
  Users,
  Dot,
} from "lucide-react";
import { useBusiness } from "@/app/providers/BusinessProvider";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useEffect, useState } from "react";

const BUSINESSLESS_ROUTES = ["/onboarding"];

const features = [
  {
    icon: Layers,
    title: "Properties",
    description: "Units & assets",
  },
  {
    icon: Users,
    title: "Tenants",
    description: "Leases & portals",
  },
  {
    icon: ShieldCheck,
    title: "Billing",
    description: "M-Pesa payments",
  },
];

const BusinessGate = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { activeBusinessId, isLoading } = useBusiness();

  const isBusinesslessRoute = BUSINESSLESS_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isBusinesslessRoute) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (!activeBusinessId) {
    return (
      <div className="relative min-h-[75vh] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="relative w-full max-w-lg">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-900/[0.04] p-8 sm:p-10">
            <div className="mx-auto w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-sm mb-5">
              <Building2 className="w-6 h-6 text-slate-700" />
            </div>

            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-700 text-[11px] font-semibold uppercase tracking-wider">
                <Dot className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Business Required
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-center">
              Set up your workspace
            </h1>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed text-center max-w-sm mx-auto">
              A business is where all your rental data lives. Properties, tenants, and payments are organized under it, private to you and your team.
            </p>

            {/* Feature list */}
            <ul className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-center"
                >
                  <Icon className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-900 leading-tight">
                    {title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-tight">
                    {description}
                  </p>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/onboarding/business"
              className="group mt-7 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <span>Create your first business</span>
              <ArrowRight className="w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-1" />
            </Link>

            <p className="mt-4 text-center text-xs text-slate-400">
              Takes about a minute. You can invite teammates later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BusinessGate;