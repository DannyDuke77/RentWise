"use client";

import { useState } from "react";
import {
  Mail, Phone, Building2, Home, Wallet, Calendar, CalendarCheck,
  ArrowRight, AlertCircle, User, Shield, Dot, ChevronDown,
  Receipt, Wrench, AlertTriangle,
  Info,
  Contact,
} from "lucide-react";
import { useTenantPortal } from "@/app/hooks/queries/useTenantPortalQueries";
import TenantPaymentModal from "../components/modals/TenantPaymentModal";
import RefreshButton from "../components/ui/RefreshButton";
import Image from "next/image";
import TenantPortalSkeleton from "../components/skeletons/TenantPortalSkeleton";
import CustomTooltip from "../components/ui/CustomTooltip";
import { Charge } from "../src/types/Types";

export default function TenantPortal() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data: tenant, refetch, isLoading, isError } = useTenantPortal();

  if (isLoading) return <TenantPortalSkeleton />;

  if (isError || !tenant) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-sm font-medium text-slate-900">
          Unable to load your account details.
        </p>
        <p className="text-xs text-slate-500">
          Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  const pendingCharges = tenant.pending_charges ?? [];
  const pendingTotal = pendingCharges.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  // Tenant-payable total = rent arrears only.
  const totalDue = tenant.tenancies.reduce((sum, t) => {
    const bal = Number(t.balance);
    return bal > 0 ? sum + bal : sum;
  }, 0);

  const totalCredit = tenant.tenancies.reduce((sum, t) => {
    const bal = Number(t.balance);
    return bal < 0 ? sum + Math.abs(bal) : sum;
  }, 0);

  const isBalanceDue = totalDue > 0;
  const paidCount = tenant.tenancies.filter((t) => Number(t.balance) <= 0).length;
  const dueCount = tenant.tenancies.length - paidCount;

  const anyMpesaAvailable = tenant.tenancies.some((t) => t.mpesa_available);
  const allMpesaUnavailable =
    tenant.tenancies.length > 0 && !anyMpesaAvailable;

  const allDisabled =
    allMpesaUnavailable &&
    tenant.tenancies.every((t) => t.mpesa_status === "disabled");

  const allNotConfigured =
    allMpesaUnavailable &&
    tenant.tenancies.every((t) => t.mpesa_status === "not_configured");

  const allUnavailableMixed =
    allMpesaUnavailable && !allDisabled && !allNotConfigured;

  const openPaymentModal = () => {
    if (!anyMpesaAvailable) return;
    setShowPaymentModal(true);
  };

  const toggleRow = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 pb-24 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 font-semibold shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tenant Portal
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {tenant.full_name.split(" ")[0]}
            </h1>
            <p className="text-sm text-slate-500">
              Manage your active tenancies, billing history, and payments.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openPaymentModal}
          disabled={!anyMpesaAvailable}
          className="relative flex items-center justify-center gap-2 group px-4 rounded-lg bg-emerald-700 text-sm font-medium text-white hover:bg-emerald-800 active:scale-[0.98] transition-colors shadow-xs disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:bg-slate-300 disabled:active:scale-100"
        >
          <span>Pay via</span>
          <Image
            src="/M-PESA.png"
            alt="M-Pesa"
            width={72}
            height={20}
            className={`object-contain transition-opacity ${
              !anyMpesaAvailable ? "opacity-60" : ""
            }`}
          />
          {!anyMpesaAvailable && <CustomTooltip message="M-Pesa is unavailable" />}
        </button>
      </div>

      {/* M-Pesa unavailable notice */}
      {allMpesaUnavailable && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            {allDisabled && (
              <>
                <p className="text-sm font-medium text-amber-900">
                  M-Pesa payments are paused
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your landlord has temporarily paused online payments. Please
                  contact them to arrange payment, or{" "}
                  <span
                    className="text-blue-600 underline cursor-pointer"
                    onClick={() => refetch()}
                  >
                    refresh
                  </span>
                </p>
              </>
            )}
            {allNotConfigured && (
              <>
                <p className="text-sm font-medium text-amber-900">
                  Online payments aren't set up yet
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your landlord hasn't enabled M-Pesa payments for this property.
                  Please contact them to arrange payment.
                </p>
              </>
            )}
            {allUnavailableMixed && (
              <>
                <p className="text-sm font-medium text-amber-900">
                  Online payments are unavailable
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Contact your landlord to arrange payment for your properties.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Financial Banner */}
      <div className="relative rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-sm border border-slate-800">
        <div className="absolute top-6 right-6 z-10">
          <RefreshButton isFetching={isLoading} refetch={refetch} showLabel={false} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-4 pr-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBalanceDue ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              {isBalanceDue ? "Overdue Payment" : "Paid"}
            </span>

            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Rent Balance Due
                </p>
                <p
                  className={`mt-1 text-3xl sm:text-4xl font-bold tracking-tight font-mono ${
                    isBalanceDue ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  KES {totalDue.toLocaleString()}
                </p>
              </div>

              {totalCredit > 0 && (
                <div className="sm:border-l sm:border-slate-800 sm:pl-8">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                    Unapplied Credit
                  </p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-mono text-emerald-400">
                    KES {totalCredit.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Across {tenant.tenancies.length}{" "}
                {tenant.tenancies.length === 1 ? "tenancy" : "tenancies"}
              </span>
              <Dot className="w-4 h-4 text-slate-400" />
              <span className="text-emerald-400 font-medium">
                {paidCount} settled
              </span>
              {dueCount > 0 && (
                <>
                  <Dot className="w-4 h-4 text-slate-400" />
                  <span className="text-amber-400 font-medium">
                    {dueCount} payment due
                  </span>
                </>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={openPaymentModal}
              disabled={!anyMpesaAvailable}
              className="relative flex items-center justify-center gap-2 group rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition-colors shadow-xs disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-slate-700 disabled:active:scale-100"
            >
              <span>Instant Checkout</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              {!anyMpesaAvailable && (
                <CustomTooltip message="M-Pesa is unavailable" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <fieldset className="space-y-2 border border-slate-200 rounded-xl p-3.5">
        <legend className="flex items-center gap-2 text-sm font-semibold text-slate-900 px-2">
          <Contact className="w-4 h-4 text-slate-600" />
          Contact
        </legend>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <Info className="w-4 h-4 text-slate-600" />
          <p className="text-xs text-slate-600">Reach out to your landlord for any information changes you need.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Email Address
              </p>
              <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                {tenant.email || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Phone Number
              </p>
              <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                {tenant.phone}
              </p>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Pending Charges */}
      {pendingCharges.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Pending Charges
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {pendingCharges.length} pending
              </span>
              <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md font-mono">
                KES {pendingTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              These charges are separate from your rent and are recorded by your landlord. Contact them directly to settle any outstanding balances. They'll mark each one as paid once received.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 rounded-xl p-1 bg-white shadow-xs overflow-hidden">
            {pendingCharges.map((charge: Charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between gap-3 p-5 hover:bg-slate-50/70 border border-slate-200 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {charge.charge_type_name || "Charge"}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        Pending
                      </span>
                    </div>
                    {charge.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {charge.description}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Added{" "}
                      {new Date(charge.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right flex-shrink-0">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Amount
                  </p>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    KES {Number(charge.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tenancies Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Your Tenancies
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {dueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {dueCount} due
              </span>
            )}
            {paidCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {paidCount} paid
              </span>
            )}
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
              Total: {tenant.tenancies.length}
            </span>
          </div>
        </div>

        {tenant.tenancies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                No active tenancies
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                You currently have no active tenancies assigned.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tenant.tenancies.map((tenancy) => {
              const balance = Number(tenancy.balance);
              const deposit_held = Number(tenancy.deposit_held);
              const paid = balance <= 0;
              const isOpen = !expanded.has(tenancy.id);

              return (
                <div
                  key={tenancy.id}
                  className={`h-fit rounded-xl border bg-white shadow-xs overflow-hidden transition-colors ${
                    isOpen
                      ? "border-slate-400"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-row sm:items-center justify-between p-5 bg-white">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {tenancy.unit}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {tenancy.property}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                        Monthly Rent
                      </p>
                      <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                        KES {Number(tenancy.monthly_rent).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`transition-all px-4 duration-200 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-fit opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
                      <Stat
                        icon={<Wallet className="w-4 h-4 text-slate-500" />}
                        label="Current balance"
                        value={
                          balance < 0
                            ? `KES ${Math.abs(balance).toLocaleString()} (Credit)`
                            : `KES ${balance.toLocaleString()}`
                        }
                        valueClass={
                          paid
                            ? "text-emerald-600 font-mono"
                            : "text-rose-600 font-mono font-semibold"
                        }
                      />
                      <Stat
                        icon={<Shield className="w-4 h-4 text-slate-500" />}
                        label="Deposit held"
                        value={`KES ${deposit_held.toLocaleString()}`}
                        valueClass="text-slate-900 font-mono"
                      />
                      <Stat
                        icon={<Calendar className="w-4 h-4 text-slate-500" />}
                        label="Tenancy created"
                        value={new Date(tenancy.created_at).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      />
                      <Stat
                        icon={<CalendarCheck className="w-4 h-4 text-slate-500" />}
                        label="Billing started"
                        value={
                          tenancy.billing_start_date
                            ? new Date(
                                tenancy.billing_start_date
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Same as start"
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${
                        paid
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          paid ? "bg-emerald-500" : "bg-amber-500 animate-ping"
                        }`}
                      />
                      {paid ? "Fully Settled" : "Payment Due"}
                    </span>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => toggleRow(tenancy.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {isOpen ? "Hide details" : "View details"}
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={openPaymentModal}
                        disabled={!tenancy.mpesa_available}
                        className={`relative group flex items-center gap-1 text-xs font-medium transition-colors ${
                          tenancy.mpesa_available
                            ? "text-emerald-700 hover:text-emerald-800"
                            : "text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        Pay now
                        <ArrowRight className="w-3.5 h-3.5" />
                        {!anyMpesaAvailable && (
                          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
                            <CustomTooltip message="M-Pesa is unavailable" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showPaymentModal && (
        <TenantPaymentModal
          tenant={tenant}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  valueClass = "text-slate-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-xs">
          {icon}
        </div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </p>
      </div>
      <p className={`mt-2 text-sm font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}