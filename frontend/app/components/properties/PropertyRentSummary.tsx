'use client';

import { useEffect, useState, useCallback } from 'react';
import apiService from '@/app/services/apiService';
import { useToday } from '@/app/src/utils/timeStore'; 
import { 
  Building, AlertCircle, RefreshCw, DollarSign, Home, 
  CheckCircle, AlertTriangle, Clock, TrendingUp, ChevronDown, ChevronUp, 
  FileText,
  ShieldCheck
} from 'lucide-react';
// Import the Modal we built
import PropertyAuditModal from '@/app/components/modals/PropertyAuditModal';

interface PropertySummary {
  total_units: number;
  paid_units: number;
  partial_units: number;
  unpaid_units: number;
  paid: number;             // Total collected strictly this calendar month
  balance: number;          // Cumulative ledger debt (+ve = Arrears)
  expected: number;         // Total potential if all units were occupied
  total_credits: number;   // Total credits applied to tenancies
  occupied_expected: number;// Total expected from current active tenancies
  occupied_units: number;
}

interface PropertyRentSummaryProps {
  propertyId: string;
  property: any;
  units: any[]
  className?: string;
  defaultExpanded?: boolean;
}

const PropertyRentSummary = ({ 
  propertyId, 
  property,
  units,
  className = '',
  defaultExpanded = true 
}: PropertyRentSummaryProps) => {
  const today = useToday(); 
  const [summary, setSummary] = useState<PropertySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state

  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      const data = await apiService.get(
        `/api/properties/${propertyId}/rent-summary/?month=${month}&year=${year}`
      );
      setSummary(data.summary);
    } catch (err) {
      setError('Failed to load rent summary');
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }, [propertyId, today]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
        <div className="p-8 text-center animate-pulse bg-gray-50/50">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-3" />
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Generating {currentMonthName} Data...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) return null;

  const collectionRate = summary.occupied_expected > 0 
    ? (summary.paid / summary.occupied_expected) * 100 
    : 0;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><DollarSign className="w-5 h-5 text-blue-600" /></div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Rent Summary</h3>
            <p className="text-sm text-blue-600/80 font-medium">{currentMonthName} {currentYear} Ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{currentMonthName} Collections</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  collectionRate >= 90 ? 'bg-green-100 text-green-800' : collectionRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {collectionRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Units Status Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Units</span>
                <p className="text-sm font-black text-gray-900">{summary.total_units}</p>
              </div>
              <div className="p-2 bg-green-50/50 border border-green-100 rounded-lg text-center">
                <span className="text-[9px] font-bold text-green-600 uppercase block">Paid</span>
                <p className="text-sm font-black text-green-700">{summary.paid_units}</p>
              </div>
              <div className="p-2 bg-yellow-50/50 border border-yellow-100 rounded-lg text-center">
                <span className="text-[9px] font-bold text-yellow-600 uppercase block">Part</span>
                <p className="text-sm font-black text-yellow-700">{summary.partial_units}</p>
              </div>
              <div className="p-2 bg-red-50/50 border border-red-100 rounded-lg text-center">
                <span className="text-[9px] font-bold text-red-600 uppercase block">Owe</span>
                <p className="text-sm font-black text-red-700">{summary.unpaid_units}</p>
              </div>
            </div>

            {/* Arrears and Credits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
                <p className="text-[10px] font-black text-green-800 uppercase mb-1">Total Received</p>
                <p className="text-base font-black text-gray-900">KES {summary.paid.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-3 shadow-sm">
                <p className="text-[10px] font-black text-red-800 uppercase mb-1">Actual Arrears</p>
                <p className="text-base font-black text-red-700">KES {summary.balance.toLocaleString()}</p>
              </div>
            </div>

            {/* DOWNLOAD BUTTON HERE */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black text-white rounded-lg transition-all shadow-sm group"
            >
              <FileText className="w-4 h-4 text-gray-400 group-hover:text-white" />
              <span className="text-sm font-bold uppercase tracking-wider">Generate Master Ledger</span>
            </button>
            
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium px-1">
              <span>Potential: KES {summary.expected.toLocaleString()}</span>
              <span>Occupied: {summary.occupied_units} units</span>
            </div>
          </div>
        </div>
      )}

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