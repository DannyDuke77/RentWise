'use client';

import { useState } from 'react';
import {
  HandCoins, CardSim, Landmark, LucideIcon, BarChart3,
  ChevronDown, ChevronUp, RefreshCcw, TrendingUp, TrendingDown, Wallet,
  CreditCard, Building2, PieChart,
  Shield,
  ShieldAlert
} from "lucide-react";
import usePaymentVisualizationModal from "@/app/hooks/usePaymentMetricsModal";
import PaymentVisualizationModal from "@/app/components/modals/PaymentVisualizationModal";
import { usePaymentAnalytics, usePropertyPaymentAnalytics } from "@/app/hooks/queries/usePaymentsQueries";
import LoadingSpinner from '../ui/LoadingSpinner';

interface PaymentStatsProps {
  label?: string;
  propertyId?: string;
  isLoading?: boolean;
  defaultExpanded?: boolean;
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor }: StatCardProps) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all hover:-translate-y-0.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <div className="text-2xl font-bold text-gray-900 mt-0.5">{value}</div>
        </div>
      </div>
    </div>
  </div>
);

const PaymentStats = ({ label, propertyId, isLoading = false, defaultExpanded = false }: PaymentStatsProps) => {
  const visualizationModal = usePaymentVisualizationModal();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const propertyQuery = usePropertyPaymentAnalytics(
    propertyId || '',
    { enabled: isExpanded && Boolean(propertyId) }
  );

  const globalQuery = usePaymentAnalytics(
    isExpanded && !propertyId
  );

  const activeQuery = propertyId ? propertyQuery : globalQuery;
  const { data: analytics, refetch, isFetching } = activeQuery;

  if (isLoading) {
    return (
      <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = analytics?.stats;

  const cards: StatCardProps[] = stats ? [
    {
      label: "Net Total",
      value: `KES ${stats.net_total_amount.toLocaleString()}`,
      icon: Wallet,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Received",
      value: (
        <div className="space-y-2">
          <span className="text-2xl font-bold text-gray-900">KES {stats.total_amount_paid.toLocaleString()}</span>
          <div className="flex gap-3 mt-1 text-sm font-medium text-gray-500">
            <span className="flex items-center gap-1"><CreditCard className="w-5 h-5" /> Rent: KES {stats.total_amount_rent_paid.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Shield className="w-5 h-5" /> Deposit: KES {stats.total_amount_deposit_paid.toLocaleString()}</span>
          </div>
        </div>
      ),
      icon: HandCoins,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Total Refunds",
      value: `KES ${stats.total_amount_refunded.toLocaleString()}`,
      icon: HandCoins,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "M-Pesa",
      value: stats.mpesa,
      icon: CardSim,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Cash",
      value: stats.cash,
      icon: HandCoins,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Bank Transfer",
      value: stats.bank_transfer,
      icon: Landmark,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ] : [];

  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-5 md:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-4 flex-1">
          <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm">
            <PieChart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{label || "Payment Analytics"}</h2>
            <p className="text-sm text-gray-500">Summary of payment activity</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isExpanded && stats && (
            <>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 border border-gray-200"
              >
                <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            
              <button
                onClick={() => visualizationModal.open()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Visualize Analytics</span>
              </button>
            </>
          )}

          <div className="flex items-center gap-3 group">
            <button className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${!isExpanded ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="px-5 md:px-6 pb-6">
            {/* Loading */}
            {isFetching && (
              <div className="py-4">
                <LoadingSpinner size="lg" color="blue-600" label="Loading payment analytics..." showTimer={true} />
              </div>
            )}

            {/* Data */}
            {!isFetching && cards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>
            )}

            {/* Empty */}
            {!isFetching && cards.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <p className="text-sm">No payment data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {analytics && (
        <PaymentVisualizationModal
          paymentMethodData={analytics.payment_methods}
          typeData={analytics.types}
          categotyData={analytics.categories}
          monthlyChartData={analytics.monthly}
        />
      )}
    </div>
  );
};

export default PaymentStats;