"use client";

import { useState } from "react";
import {
  User,
  Home,
  DollarSign,
  Wrench,
  UserCheck,
  UserX,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import ViewUnitButton from "../navigation/ViewUnitButton";
import useUnitModal from "@/app/hooks/useUnitModal";
import { Property, Unit } from "@/app/src/types/Types";
import { useUpdateUnit } from "@/app/hooks/mutations/useUnitMutations";
import ConfirmModal from "@/app/components/modals/ConfirmModal";
import { useToast } from "@/app/providers/ToastProvider";

export type PaymentStatus = "unknown" | "paid" | "partial" | "unpaid" | "vacant" | "not_billed";

interface UnitRowProps {
  property: Property;
  unit: Unit;
  variant?: "grid" | "list";
}

const occupancyIcon = {
  occupied: <UserCheck className="text-emerald-500 shrink-0" width={16} height={16} />,
  vacant: <UserX className="text-gray-400 shrink-0" width={16} height={16} />,
  maintenance: <Wrench className="text-amber-500 shrink-0" width={16} height={16} />,
};

const paymentBadge: Record<PaymentStatus, string> = {
  unknown: "bg-gray-100 text-gray-600 border-gray-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  unpaid: "bg-rose-50 text-rose-700 border-rose-200",
  vacant: "bg-gray-50 text-gray-400 border-gray-200 italic",
  not_billed: "bg-blue-50 text-blue-700 border-blue-200 italic",
};

const paymentText: Record<PaymentStatus, string> = {
  unknown: "text-gray-500",
  paid: "text-emerald-600",
  partial: "text-amber-500",
  unpaid: "text-rose-600",
  vacant: "text-gray-400 italic font-normal",
  not_billed: "text-blue-500 italic font-normal",
};

const UnitRow: React.FC<UnitRowProps> = ({ property, unit, variant = "list" }) => {
  const unitModal = useUnitModal();
  const updateUnit = useUpdateUnit();
  const { showToast } = useToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = () => {
    if (unit.status === "occupied") {
      showToast(
        "Unit Occupied!",
        "Please vacate the tenant first before deleting the unit.",
        "warning",
        10000
      );
      return;
    }
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!unit || unit.status === "occupied") return;
    try {
      await updateUnit.mutateAsync({
        unitId: unit.id,
        propertyId: property.id,
        payload: { is_active: false },
      });
      setIsDeleteModalOpen(false);
      showToast(`Unit ${unit.name} Deleted!`, "Your unit has been deleted successfully.", "success");
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.detail ||
        (Array.isArray(error?.response?.data) ? error.response.data[0] : null) ||
        error?.message ||
        "Something went wrong while deleting this unit. Please try again.";
      setDeleteError(backendMessage);
    }
  };

  const paymentStatus = (unit.rent_status?.status || "unknown") as PaymentStatus;
  const isUnitOccupied = unit.status === "occupied";
  const isMaintenance = unit.status === "maintenance";
  const isVacant = unit.status === "vacant";

  const effectivePaymentStatus: PaymentStatus = isVacant ? "vacant" : paymentStatus;

  return (
    <div
      className={[
        "group transition-all border rounded-xl bg-white",
        variant === "grid"
          ? "border-gray-200 hover:border-blue-300 hover:shadow-sm"
          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 mb-3 sm:mb-0",
      ].join(" ")}
    >
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        {/* Top / Left Section: Badge, Title & Tenant Info */}
        <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Unit Icon / Badge */}
            <div className="relative shrink-0">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 border text-sm sm:text-base font-bold rounded-xl flex items-center justify-center transition-colors ${
                  isMaintenance
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-blue-50/80 border-blue-200 text-blue-700"
                }`}
              >
                {unit.name}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-2xs">
                <Home className="w-2.5 h-2.5 text-blue-600" />
              </div>
            </div>

            {/* Unit Name and Tenant Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3
                  className={`font-semibold text-sm sm:text-base truncate ${
                    isMaintenance ? "text-gray-500 line-through decoration-1" : "text-gray-900"
                  }`}
                >
                  Unit {unit.name}
                </h3>
                {occupancyIcon[unit.status]}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">
                  {unit.tenant_names || unit.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status Badge (Visible on Top-Right in Mobile View) */}
          <div className="sm:hidden shrink-0">
            <span
              className={`inline-flex items-center gap-1 font-medium tracking-wide rounded-full border text-[10px] px-2 py-0.5 uppercase ${paymentBadge[effectivePaymentStatus]}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {effectivePaymentStatus.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Bottom / Right Section: Financials & Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 border-t sm:border-t-0 border-gray-100 pt-2.5 sm:pt-0 shrink-0">
          {/* Rent Details */}
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-gray-400 hidden xs:block" />
            <div className="text-left sm:text-right leading-tight">
              <p
                className={`font-bold text-sm sm:text-base ${
                  isMaintenance ? "text-gray-400" : paymentText[effectivePaymentStatus]
                }`}
              >
                {unit.monthly_rent.toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400">/ month</p>
            </div>
          </div>

          {/* Payment Status Badge (Desktop View) */}
          <div className="hidden sm:block">
            <span
              className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide rounded-full border whitespace-nowrap text-xs px-3 py-1 ${paymentBadge[effectivePaymentStatus]}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              <span>{effectivePaymentStatus.replace("_", " ")}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <ViewUnitButton property={property} unit={unit as any} />

            <Menu as="div" className="relative">
              <MenuButton className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors focus:outline-none">
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </MenuButton>

              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-in"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <MenuItems className="absolute right-0 mt-2 w-36 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none z-50 p-1">
                  <div className="py-0.5">
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={() => unitModal.open(property, unit as Unit, true)}
                          className={`${
                            active ? "bg-blue-50 text-blue-700" : "text-gray-700"
                          } group flex w-full items-center rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors`}
                        >
                          <Edit2 className="mr-2 h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          Edit Unit
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={handleDeleteClick}
                          className={`${
                            active ? "bg-rose-50 text-rose-700" : "text-gray-700"
                          } group flex w-full items-center rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium transition-colors`}
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-gray-400 group-hover:text-rose-600" />
                          Delete Unit
                        </button>
                      )}
                    </MenuItem>
                  </div>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        icon={
          <AlertTriangle
            size={28}
            className={isUnitOccupied ? "text-amber-600" : "text-red-600"}
          />
        }
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={updateUnit.isPending}
        title="Delete Unit"
        message="Remove this unit from your property?"
        message2="The unit will no longer appear in your active units."
        disableConfirm={updateUnit.isPending || deleteError !== null}
        confirmText="Remove Unit"
      />
    </div>
  );
};

export default UnitRow;