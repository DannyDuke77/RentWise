'use client';

import { User, ChevronRight, Home, DollarSign, Wrench, Square, UserCheck, UserX, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import ViewUnitButton from "../navigation/ViewUnitButton";
import { UnitType } from "../modals/UnitModal";
import { use, useEffect, useState } from "react";
import apiService from "@/app/services/apiService";
import { useToday } from "@/app/src/utils/timeStore";
import useUnitDetailModal from "@/app/hooks/useUnitDetailModal";

interface UnitRowProps {
  unit: UnitType;
}

const statusStyles = {
  occupied: 'bg-emerald-100 text-emerald-800',
  vacant: 'bg-rose-100 text-rose-800',
  maintenance: 'bg-amber-100 text-amber-800',
};

const statusIcons = {
  occupied: <UserCheck className="text-green-500" width={20} height={20} />,
  vacant: <UserX className="text-red-500" width={20} height={20} />,
  maintenance: <Wrench className="text-yellow-500" width={20} height={20} />
};

type PaymentStatus = "unknown" | "paid" | "partial" | "unpaid";

const UnitRow: React.FC<UnitRowProps> = ({
  unit,
}) => {
  const today = useToday();
  const [payments, setPayments] = useState<any[]>([]);

  const unitDetailModal = useUnitDetailModal();

  useEffect(() => {
    if (!unit?.id) return;

    const fetchPayments = async () => {
      try {
        const data = await apiService.get(`/api/units/${unit.id}/payments/`);
        setPayments(data.payments); // array of payments for this unit
      } catch (error) {
        setPayments([]); // fallback
      }
    };

    fetchPayments();
  }, [unit?.id]);


  const getThisMonthPaymentSummary = (): { status: PaymentStatus; totalPaid: number; remaining: number } => {
    if (!unit) return {
      status: "unknown",
      totalPaid: 0,
      remaining: 0,
    };

    const month = today.getMonth();
    const year = today.getFullYear();

    // Filter payments made in the current month
    const thisMonthPayments = payments.filter(p => {
        const paymentDate = new Date(p.paid_for);
        return paymentDate.getFullYear() === year && paymentDate.getMonth() === month;
    });

    const totalPaid = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
    const remaining = Math.max(unit.monthly_rent - totalPaid, 0);

    let status: "paid" | "partial" | "unpaid" = "unpaid";
    if (totalPaid >= unit.monthly_rent) status = "paid";
    else if (totalPaid > 0) status = "partial";

    return { status, totalPaid, remaining };
  };

  const unitPaymentStatus = getThisMonthPaymentSummary();

  const paymentStatusColors = {
    unknown: "bg-gray-100 text-gray-800 border-gray-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
    unpaid: "bg-rose-100 text-rose-800 border-rose-200",
  };

  const statusColorMap: Record<PaymentStatus, string> = {
    unknown: 'bg-gray-100 text-gray-800 border-gray-200',
    paid: 'text-green-500',
    partial: 'text-yellow-500',
    unpaid: 'text-rose-500'
  };
  const statusColor = statusColorMap[unitPaymentStatus.status] || '';

  return (
    <div className="group p-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-white hover:to-gray-50/50 border-6 border-transparent hover:border-l-6 hover:border-l-blue-400 transition-all duration-300">
      {/* Left Content */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Unit Number */}
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-700 font-bold rounded-xl flex items-center justify-center">
            {unit.name}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-blue-200 flex items-center justify-center shadow-xs">
            <Home className="w-2.5 h-2.5 text-blue-600" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 truncate">Unit {unit.name}</h3>
            <span className="">{statusIcons[unit.status]}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 truncate">
              {unit.tenant_names || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex items-center gap-6">
        {/* Rent */}
        <div className="hidden md:flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <div className="text-right">
            <p className={`font-bold ${statusColor}`}>{unit.monthly_rent}</p>
            <p className="text-xs text-gray-500">monthly</p>
          </div>
        </div>
        
        {/* Mobile Rent */}
        <div className="md:hidden flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className={`font-bold ${statusColor}`}>{unit.monthly_rent}</span>
        </div>

        {/* Payment Status */}
        <span className={`hidden md:flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${paymentStatusColors[unitPaymentStatus.status]}`}>
          {unitPaymentStatus.status.toUpperCase()}
        </span>

        <div className="flex items-center gap-2">
          <ViewUnitButton unit={unit} />

          <Menu as="div" className="relative">
             <Menu.Button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <MoreVertical className="w-5 h-5 text-gray-500" />
             </Menu.Button>
             
             <Transition
               enter="transition duration-100 ease-out"
               enterFrom="transform scale-95 opacity-0"
               enterTo="transform scale-100 opacity-100"
               leave="transition duration-75 ease-in"
               leaveFrom="transform scale-100 opacity-100"
               leaveTo="transform scale-95 opacity-0"
             >
               <Menu.Items className="absolute right-0 mt-2 w-32 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                 <div className="px-1 py-1">
                   <Menu.Item>
                     {({ active }) => (
                       <button
                         onClick={() => unitDetailModal.open(unit, true)}
                         className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                       >
                         <Edit2 className="mr-2 h-4 w-4" /> Edit
                       </button>
                     )}
                   </Menu.Item>
                   <Menu.Item>
                     {({ active }) => (
                       <button
                         onClick={() => unitDetailModal.open(unit, false)}
                         className={`${active ? 'bg-rose-50 text-rose-700' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                       >
                         <Trash2 className="mr-2 h-4 w-4" /> Delete
                       </button>
                     )}
                   </Menu.Item>
                 </div>
               </Menu.Items>
             </Transition>
           </Menu>
        </div>
        {/* Action */}
        
      </div>
    </div>
  );
};

export default UnitRow;