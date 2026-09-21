"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

const currency = (n: number, code = "KES") =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(n);

const monthLabel = (offset: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
};

export default function RentCollectionComparison({
  thisMonth,
  lastMonth,
  changePct,
  currencyCode = "KES",
}: {
  thisMonth: number;
  lastMonth: number;
  changePct: number | null;
  currencyCode?: string;
}) {
  const max = Math.max(thisMonth, lastMonth, 1);
  const thisPct = (thisMonth / max) * 100;
  const lastPct = (lastMonth / max) * 100;

  const hasComparison = lastMonth > 0;
  const isUp = changePct !== null && changePct > 0;
  const isDown = changePct !== null && changePct < 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Rent collected
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasComparison
              ? "This month vs. last month"
              : "This month"}
          </p>
        </div>
        <Link
          href="/payments"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
        >
          View payments
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* This month */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {monthLabel(0)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                {currency(thisMonth, currencyCode)}
              </span>
              {changePct !== null && hasComparison && (
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                    isUp
                      ? "text-emerald-600"
                      : isDown
                      ? "text-rose-600"
                      : "text-slate-500"
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : isDown ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {isUp ? "+" : ""}
                  {changePct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${thisPct}%` }}
            />
          </div>
        </div>

        {/* Last month */}
        {hasComparison && (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {monthLabel(1)}
              </span>
              <span className="text-base font-semibold text-slate-600 tracking-tight">
                {currency(lastMonth, currencyCode)}
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 rounded-full transition-all duration-500"
                style={{ width: `${lastPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasComparison && thisMonth === 0 && (
          <p className="text-xs text-slate-400 text-center pt-1">
            No collections recorded yet this month.
          </p>
        )}
      </div>
    </div>
  );
}