'use client';

import { User, Home, DollarSign, Wrench, UserCheck, UserX, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import ViewUnitButton from "../navigation/ViewUnitButton";
import useUnitDetailModal from "@/app/hooks/useUnitDetailModal";
import { UnitType } from "../modals/UnitModal";
import { PropertyType } from "@/app/properties/page";
import { useRouter } from "next/navigation";
import apiService from "@/app/services/apiService";
import { useState } from "react";

export type PaymentStatus = "unknown" | "paid" | "partial" | "unpaid" | "vacant";

interface UnitRowProps {
  property: PropertyType;
  unit: UnitType;
}

const statusIcons = {
  occupied: <UserCheck className="text-green-500" width={20} height={20} />,
  vacant: <UserX className="text-red-500" width={20} height={20} />,
  maintenance: <Wrench className="text-yellow-500" width={20} height={20} />
};

const UnitRow: React.FC<UnitRowProps> = ({ property, unit }) => {
  const unitDetailModal = useUnitDetailModal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSoftDelete = async () => {
    if (unit.status === "occupied") {
      alert("Cannot delete an occupied unit. Please terminate the lease first.");
      return;
    }
    
    if (!unit?.id || !confirm("Are you sure you want to delete this unit?")) return;

    try {
        await apiService.patch(`/api/units/${unit.id}/`, { is_active: false });
        router.refresh();
        close();
    } catch (error) {
        console.error("Delete failed", error);
    } finally {
        setLoading(false);
    }
};

  const getPaymentSummary = () => {
    const status = (unit.rent_status?.status || "unpaid") as PaymentStatus;
    const totalPaid = unit.rent_status?.paid || 0;
    const balance = unit.rent_status?.balance || 0;
    const remaining = balance > 0 ? Math.min(balance, unit.rent_status?.rent || unit.monthly_rent) : 0;

    return { status, totalPaid, remaining };
  };

  const unitPaymentStatus = getPaymentSummary();

  const paymentStatusColors: Record<PaymentStatus, string> = {
    unknown: "bg-gray-100 text-gray-800 border-gray-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
    unpaid: "bg-rose-100 text-rose-800 border-rose-200",
    vacant: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const statusColorMap: Record<PaymentStatus, string> = {
    unknown: 'text-gray-500',
    paid: 'text-emerald-600',
    partial: 'text-amber-500',
    unpaid: 'text-rose-600',
    vacant: 'text-gray-400 italic font-normal',
  };
  
  const statusColor = statusColorMap[unitPaymentStatus.status] || '';

  return (
    <div className="group p-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-white hover:to-gray-50/50 border-6 border-transparent hover:border-l-6 hover:border-l-blue-400 transition-all duration-300">
      {/* Left Content */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Unit Number Badge */}
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-700 font-bold rounded-xl flex items-center justify-center">
            {unit.name}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-blue-200 flex items-center justify-center shadow-xs">
            <Home className="w-2.5 h-2.5 text-blue-600" />
          </div>
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-gray-900 truncate ${unit.status === 'maintenance' ? 'line-through decoration-2' : ''}`}>
              Unit {unit.name}
            </h3>
            <span>{statusIcons[unit.status]}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 truncate">
              {unit.tenant_names ? unit.tenant_names : unit.status.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex items-center gap-6">
        {/* Desktop Rent Column */}
        <div className="hidden md:flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <div className="text-right">
            <p className={`font-bold ${statusColor}`}>{unit.monthly_rent.toLocaleString()}</p>
            <p className="text-xs text-gray-500">monthly</p>
          </div>
        </div>
        
        {/* Mobile Rent Display */}
        <div className="md:hidden flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className={`font-bold ${statusColor}`}>{unit.monthly_rent.toLocaleString()}</span>
        </div>

        {/* Payment Status Badge */}
        <span className={`hidden md:flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${paymentStatusColors[unitPaymentStatus.status]}`}>
          {unitPaymentStatus.status.toUpperCase()}
        </span>

        {/* Dropdown Menu Hooks */}
        <div className="flex items-center gap-2">
          <ViewUnitButton property={property} unit={unit as any} />

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
                         onClick={() => unitDetailModal.open(property, unit as any, true)}
                         className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                       >
                         <Edit2 className="mr-2 h-4 w-4" /> Edit
                       </button>
                     )}
                   </Menu.Item>
                   <Menu.Item>
                     {({ active }) => (
                       <button
                         onClick={() => handleSoftDelete()}
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
      </div>
    </div>
  );
};

export default UnitRow;