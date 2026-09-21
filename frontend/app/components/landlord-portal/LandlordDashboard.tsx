"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Home,
  TrendingUp,
  TrendingDown,
  Plus,
  Wallet,
  Wrench,
  UserCheck,
  AlertCircle,
  ChevronRight,
  RefreshCcw,
  Receipt,
} from "lucide-react";
import { useBusiness } from "@/app/providers/BusinessProvider";
import { useDashboard } from "@/app/hooks/queries/useDashboardQueries";
import RentCollectionComparison from "./RentCollectionComparison";
import AddPropertyButton from "../navigation/AddPropertyButton";
import RefreshButton from "../ui/RefreshButton";

/* ─────────────── helpers ─────────────── */

const currency = (n: number | undefined, code = "KES") =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
};

/* ─────────────── page ─────────────── */

export default function LandlordDashboard() {
  const { activeBusiness } = useBusiness();
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <DashboardError onRetry={refetch} />;

  const { kpis } = data;
  const currencyCode = activeBusiness?.currency ?? "KES";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{greeting()},</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {activeBusiness?.company_name ?? "Your portfolio"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening across your properties today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton isFetching={isFetching} refetch={refetch} showLabel={false} />
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            View properties
          </Link>
          <AddPropertyButton />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Occupancy"
          value={`${kpis.occupancy_rate.toFixed(1)}%`}
          sub={`${kpis.occupied} of ${kpis.total_units} units`}
          icon={TrendingUp}
          tone="blue"
          href="/properties"
        />
        <KpiCard
          label="Collected this month"
          value={currency(kpis.rent_collected_this_month, currencyCode)}
          sub="vs. last month"
          delta={kpis.rent_collected_change_pct}
          icon={Wallet}
          tone="emerald"
          href="/payments"
        />
        <KpiCard
          label="Outstanding"
          value={currency(kpis.rent_outstanding, currencyCode)}
          sub={`${kpis.unpaid_units_count} units behind`}
          icon={AlertCircle}
          tone="amber"
        />
        <KpiCard
          label="Open maintenance"
          value={kpis.maintenance}
          sub="units needing attention"
          icon={Wrench}
          tone="rose"
          href="/units"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OverdueRentPanel
            units={data.overdue_units}
            currencyCode={currencyCode}
          />
          <RecentProperties properties={data.properties_preview} />
          <RecentChargesPanel
            charges={data.recent_charges}
            currencyCode={currencyCode}
          />
        </div>

        <div className="space-y-6">
          <RentCollectionComparison
            thisMonth={kpis.rent_collected_this_month}
            lastMonth={kpis.rent_collected_prev_month}
            changePct={kpis.rent_collected_change_pct}
            currencyCode={currencyCode}
          />
          <OccupancyPanel kpis={kpis} />
        </div>
      </div>

      {/* Activity */}
      <ActivityFeed items={data.recent_activity} />
    </div>
  );
}

/* ─────────────── KPI card ─────────────── */

const TONES = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-500/10" },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    ring: "ring-emerald-500/10",
  },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-500/10" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-500/10" },
} as const;

function KpiCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number | null;
  icon: React.ElementType;
  tone: keyof typeof TONES;
  href?: string;
}) {
  const t = TONES[tone];
  const Wrapper: any = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl ${t.bg} ${t.text} ring-4 ${t.ring} flex items-center justify-center`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {href && (
          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
          {value}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {typeof delta === "number" && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                delta >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {delta >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {sub && <span className="text-xs text-slate-500">{sub}</span>}
        </div>
      </div>
    </Wrapper>
  );
}

/* ─────────────── panels ─────────────── */

function OverdueRentPanel({
  units,
  currencyCode,
}: {
  units: Array<{
    unit: {
      id: string;
      name: string;
      status?: string;
    };
    property: {
      id: string;
      name: string;
    };
    tenant_name: string | null;
    amount_due: number;
    days_overdue: number;
  }>;
  currencyCode: string;
}) {
  return (
    <Panel
      title="Overdue rent"
      subtitle="Tenants with a balance past due"
      action={{ label: "View all", href: "/units" }}
    >
      {units.length === 0 ? (
        <EmptyRow icon={UserCheck} message="Everyone's paid up. Nice." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {units.map((row) => (
            <li key={row.unit.id}>
              <Link
                href={`/properties/${row.property.id}/units/${row.unit.id}`}
                className="flex items-center gap-4 py-3 px-1 -mx-1 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {row.tenant_name ?? "Unassigned"} · {row.property.name}{" "}
                    {row.unit.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.days_overdue > 0
                      ? `${row.days_overdue} days overdue`
                      : "Due this month"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {currency(row.amount_due, currencyCode)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RecentProperties({
  properties,
}: {
  properties: Array<{
    id: string;
    name: string;
    units_count: number;
    occupied_units_count: number;
  }>;
}) {
  return (
    <Panel
      title="Your properties"
      subtitle="Recently added or updated"
      action={{ label: "Manage", href: "/properties" }}
    >
      {properties.length === 0 ? (
        <EmptyRow
          icon={Building2}
          message="No properties yet. Add your first one to get started."
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {properties.map((p) => {
            const occupancy = p.units_count
              ? Math.round((p.occupied_units_count / p.units_count) * 100)
              : 0;
            return (
              <li key={p.id}>
                <Link
                  href={`/properties/${p.id}`}
                  className="flex items-center gap-4 py-3 px-1 -mx-1 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.units_count} {p.units_count === 1 ? "unit" : "units"} ·{" "}
                      {occupancy}% occupied
                    </p>
                  </div>
                  <div className="hidden sm:block w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function RecentChargesPanel({
  charges,
  currencyCode,
}: {
  charges: Array<{
    id: string;
    type_name: string;
    amount: number;
    status: "pending" | "paid" | "waived";
    unit: {
      id: string;
      name: string;
    };
    property: {
      id: string;
      name: string;
    };
    description: string;
    created_at: string;
  }>;
  currencyCode: string;
}) {
  const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    waived: "bg-slate-100 text-slate-500 border-slate-200",
  };

  return (
    <Panel
      title="Recent charges"
      subtitle="Levied against tenancies"
      action={{ label: "View all", href: "/charges" }}
    >
      {charges.length === 0 ? (
        <EmptyRow icon={Receipt} message="No charges recorded yet." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {charges.map((c) => (
            <li key={c.id} className="flex items-center gap-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {c.type_name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {c.property.name} · {c.unit.name} ·{" "}
                  {relativeTime(c.created_at)}
                </p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {currency(c.amount, currencyCode)}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                    STATUS_STYLES[c.status] ?? ""
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function OccupancyPanel({
  kpis,
}: {
  kpis: { occupied: number; vacant: number; maintenance: number };
}) {
  const total = kpis.occupied + kpis.vacant + kpis.maintenance || 1;
  const pct = (n: number) => (n / total) * 100;

  const segments = [
    { label: "Occupied", count: kpis.occupied, color: "#10b981" },
    { label: "Vacant", count: kpis.vacant, color: "#f59e0b" },
    { label: "Maintenance", count: kpis.maintenance, color: "#f43f5e" },
  ];

  let acc = 0;
  const gradient = segments
    .map((s) => {
      const start = acc;
      acc += pct(s.count);
      return `${s.color} ${start}% ${acc}%`;
    })
    .join(", ");

  return (
    <Panel title="Portfolio occupancy">
      <div className="flex items-center gap-6 py-2">
        <div className="relative w-32 h-32 shrink-0">
          <div
            className="w-full h-full rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">
              {Math.round(pct(kpis.occupied))}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              occupied
            </span>
          </div>
        </div>

        <ul className="flex-1 space-y-2.5">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-slate-600 flex-1">{s.label}</span>
              <span className="font-semibold text-slate-900">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function ActivityFeed({
  items,
}: {
  items: Array<{ id: string; type: string; text: string; created_at: string }>;
}) {
  return (
    <Panel title="Recent activity">
      {items.length === 0 ? (
        <EmptyRow icon={AlertCircle} message="No recent activity yet." />
      ) : (
        <ol className="relative border-l border-slate-200 ml-2 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="pl-6 relative">
              <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
              <p className="text-sm text-slate-700">{item.text}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {relativeTime(item.created_at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* ─────────────── primitives ─────────────── */

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
          >
            {action.label}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function EmptyRow({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="py-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm text-slate-500 max-w-xs mx-auto">{message}</p>
    </div>
  );
}

/* ─────────────── states ─────────────── */

function DashboardSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-20 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-56 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-slate-100 rounded-2xl" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-rose-600" />
        </div>
        <h1 className="mt-6 text-xl font-bold text-slate-900">
          Couldn't load your dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Something went wrong while fetching your data.
        </p>
        <button
          onClick={onRetry}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}