'use client';

import { useState, useCallback } from 'react';
import { useToday } from '@/app/src/utils/timeStore'; 
import { 
  AlertCircle, DollarSign, ChevronDown, ChevronUp, 
  FileText,  PieChart, ArrowUpRight, ArrowDownRight,
  CalendarDays
} from 'lucide-react';

import PropertyAuditModal from '@/app/components/modals/PropertyAuditModal';
import { usePropertySummary } from '@/app/hooks/queries/usePropertyQueries';
import LoadingSpinner from '../ui/LoadingSpinner';
import RefreshButton from '../ui/RefreshButton';

export interface PropertySummary {
  total_units: number;
  paid_units: number;
  partial_units: number;
  unpaid_units: number;
  paid: number;
  balance: number;
  expected: number;
  total_credits: number;
  occupied_expected: number;
  occupied_units: number;
}

interface PropertyRentSummaryProps {
  propertyId: string;
  property: any;
  className?: string;
  defaultExpanded?: boolean;
}

const PropertyRentSummary = ({ 
  propertyId, 
  property,
  className = '',
  defaultExpanded = false 
}: PropertyRentSummaryProps) => {
  const today = useToday();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const { data: summary, refetch: refetchSummary, isFetching: isSummaryFetching, isError } = usePropertySummary(
    propertyId, 
    month, 
    year, 
    { enabled: isExpanded && Boolean(property) }
  );

  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();

  const collectionRate = summary && summary.occupied_expected > 0 
    ? (summary.paid / summary.occupied_expected) * 100 
    : 0;

  // Determine status color and label
  const getCollectionStatus = (rate: number) => {
    if (rate >= 90) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (rate >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (rate >= 50) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const status = getCollectionStatus(collectionRate);

  const UNIT_STATUS_CONFIG = [
    { label: 'Total', key: 'total_units', color: 'blue' },
    { label: 'Paid', key: 'paid_units', color: 'emerald' },
    { label: 'Partial', key: 'partial_units', color: 'amber' },
    { label: 'Unpaid', key: 'unpaid_units', color: 'red' }
  ] as const;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-1000 ${className}`}>
      {/* Header / Toggle Button */}
      <div className="flex items-center justify-between p-5 md:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-4 flex-1">
          <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              Rent Summary
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {currentMonthName} {currentYear}
              </span>
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {currentMonthName} {currentYear} Ledger
            </p>
          </div>
        </div>
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

      {/* Expanded Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {isError && (
                <span className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  Failed to load
                </span>
              )}
              {!isError && summary && (
                <span className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              )}
            </div>
            <RefreshButton isFetching={isSummaryFetching} refetch={refetchSummary} />
          </div>

          {/* Loading State */}
          {isSummaryFetching && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner
                size="lg"
                color="blue-600"
                label="Fetching rent summary..."
                showTimer={true}
              />
            </div>
          )}

          {/* Error State */}
          {isError && !isSummaryFetching && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-red-600 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle className="w-8 h-8" />
              <span className="text-sm font-medium">Failed to load rent summary.</span>
              <button
                onClick={() => refetchSummary()}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Data Display */}
          {!isSummaryFetching && !isError && summary && (
            <div className="space-y-5 pt-3">
              {/* Collection Rate Card */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{currentMonthName} Collection Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {collectionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(collectionRate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Unit Status Grid */}
              <div className="grid grid-cols-4 gap-2">
                {UNIT_STATUS_CONFIG.map(({ label, key, color }) => (
                  <div 
                    key={label} 
                    className={`p-3 bg-${color}-50/60 rounded-xl border border-${color}-100 text-center hover:bg-${color}-100/50 transition-colors`}
                  >
                    <span className={`text-[10px] font-bold text-${color}-600 uppercase tracking-wider block`}>
                      {label}
                    </span>
                    <p className={`text-lg font-black text-${color}-700`}>{summary[key as keyof typeof summary]}</p>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Received</p>
                      <p className="text-xl font-black text-gray-900 mt-1">KES {summary.paid.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-emerald-200/50 rounded-lg">
                      <ArrowUpRight className="w-5 h-5 text-emerald-700" />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600/70 mt-1">
                    From {summary.paid_units} unit{summary.paid_units !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Outstanding Balance</p>
                      <p className="text-xl font-black text-red-700 mt-1">KES {summary.balance.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-red-200/50 rounded-lg">
                      <ArrowDownRight className="w-5 h-5 text-red-700" />
                    </div>
                  </div>
                  <p className="text-xs text-red-600/70 mt-1">
                    {summary.unpaid_units} unit{summary.unpaid_units !== 1 ? 's' : ''} in arrears
                  </p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Potential Revenue</p>
                  <p className="text-lg font-bold text-gray-900">KES {summary.expected.toLocaleString()}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">If all units occupied</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Occupied Units</p>
                  <p className="text-lg font-bold text-gray-800">{summary.occupied_units} / {summary.total_units}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    {summary.total_units > 0 ? ((summary.occupied_units / summary.total_units) * 100).toFixed(0) : 0}% occupancy
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black text-white rounded-xl transition-all shadow-md hover:shadow-lg group"
                >
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
                  <span className="text-sm font-bold uppercase tracking-wider">Generate Master Ledger</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Audit Modal */}
      <PropertyAuditModal 
        propertyId={propertyId}
        propertyName={property?.name || 'Property'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default PropertyRentSummary;