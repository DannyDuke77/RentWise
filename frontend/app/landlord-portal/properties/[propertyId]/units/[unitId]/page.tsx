"use client";

import { useParams } from "next/navigation";
import { Building2, AlertCircle, RotateCcw, DoorOpen, Dot, House } from "lucide-react";
import BackButton from "@/app/components/navigation/BackButton";
import Link from "next/link";
import { useUnit } from "@/app/hooks/queries/useUnitsQueries";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import UnitTabsSection from "@/app/components/units/UnitTabsSection";

const UnitDetailPage = () => {
  const { unitId } = useParams<{ unitId: string }>();

  const { data: unit, isLoading, isError } = useUnit(unitId);

  {/* Custom Data loading messages 
    const dataMessages = [
        { time: 0, message: "Fetching your data..." },
        { time: 4, message: "Loading large dataset..." },
        { time: 8, message: "Still loading... This might take a moment" },
        { time: 15, message: "We're experiencing high traffic. Please wait..." },
        { time: 30, message: "This is taking unusually long. Please check your connection." },
    ];
  */}

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner
          size="lg"
          color="blue-600"
          // messages={dataMessages}
          label="Fetching unit details..."
          showTimer={true}
        />
      </div>
      
    );
  }

  if (isError || !unit) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-xl shadow-slate-100/50 space-y-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Unable to load unit details
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              We couldn't retrieve the information for this unit. Check your network or try again.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <BackButton property={null} />
            <Link
              href={`/landlord-portal/units/${unitId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOccupied = unit?.status === 'occupied';

  const getFloorDisplay = (floor: string) => {
    const num = Number(floor);
    if (Number.isNaN(num)) return floor;
    if (num === 0) return 'Ground Floor';
    const suffix = (num % 10 === 1 && num % 100 !== 11) ? 'st' :
    (num % 10 === 2 && num % 100 !== 12) ? 'nd' :
    (num % 10 === 3 && num % 100 !== 13) ? 'rd' : 'th';
    return `${num}${suffix} Floor`;
  }; 

  return (
    <div className="space-y-6 mt-10 md:mt-0">
      {/* Top Bar with Navigation & Global Header */}
      <div className="space-y-4 p-6 sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-md">

        {/* Global Compact Context Header */}
        <div className="flex flex-row items-center justify-between gap-4 pt-1">
          <div className="space-y-1 ">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <House className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Unit {unit?.name || '—'}
              </h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isOccupied 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : unit?.status === 'maintenance' 
                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                {unit?.status ? unit.status.charAt(0).toUpperCase() + unit.status.slice(1) : 'Vacant'}
              </span>
            </div>
            <p className="flex items-center text-xs sm:text-sm font-medium text-slate-500 pl-12">
              {unit.property.name ? `${unit.property.name}` : ''} <Dot /> {getFloorDisplay(unit?.floor || '0')}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl self-start sm:self-auto flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rent / Month</p>
              <p className="text-lg font-black text-slate-900">
                KES {Number(unit?.monthly_rent || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <UnitTabsSection unitId={unitId} initialUnit={unit} property={unit?.property} />
      </div>
    </div>
  );
};

export default UnitDetailPage;