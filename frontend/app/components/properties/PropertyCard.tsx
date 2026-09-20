import React, { useState } from "react";
import { 
  MapPin, 
  Building2, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  ChevronRight, 
  Dot
} from "lucide-react";
import Link from "next/link";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import usePropertyModal from "@/app/hooks/usePropertyModal";
import { Property } from "@/app/src/types/Types";
import { useUpdateProperty } from "@/app/hooks/mutations/usePropertyMutations";
import ConfirmModal from "../modals/ConfirmModal";
import { useToast } from "@/app/providers/ToastProvider";

interface PropertyCardProps {
  property: Property;
}

const statusMap = {
  full: {
    label: 'Fully Occupied',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-500/10',
    dotClass: 'bg-emerald-500',
  },
  partial: {
    label: 'Partially Vacant',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-amber-500/10',
    dotClass: 'bg-amber-500',
  },
  low: {
    label: 'Fully Vacant',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60 ring-rose-500/10',
    dotClass: 'bg-rose-500',
  },
};

const getStatus = (units: number, occupied: number) => {
  if (units === 0) return 'low';
  if (occupied === units) return 'full';
  if (occupied > 0) return 'partial';
  return 'low';
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const propertyModal = usePropertyModal();
  const updateProperty = useUpdateProperty();
  const { showToast } = useToast();

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const isPropertyOccupied = property.occupied_units_count > 0;
  const occupancyPercentage = property.units_count > 0 
    ? Math.round((property.occupied_units_count / property.units_count) * 100) 
    : 0;

  const handleDeactivateClick = () => {
    if (isPropertyOccupied) {
      showToast(
        'Property Occupied!', 
        `${property.occupied_units_count} ${property.occupied_units_count === 1 ? 'unit is' : 'units are'} currently occupied. Please terminate active tenancies before deactivating.`, 
        'error', 
        6000
      );
      return;
    }

    setDeactivateError(null);
    setIsDeactivateModalOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!property) return;

    try {
      await updateProperty.mutateAsync({ 
        propertyId: property.id,
        payload: { is_active: false } 
      });

      setIsDeactivateModalOpen(false);
      showToast('Property Deactivated', 'Your property has been deactivated successfully.', 'success');
    } catch (error: any) {
      console.error("Error deactivating property:", error);
      const backendMessage = error?.response?.data?.detail
        || (Array.isArray(error?.response?.data) ? error.response.data[0] : null)
        || error?.message
        || "Something went wrong while deactivating this property.";
      setDeactivateError(backendMessage);
    }
  };
  
  const status = getStatus(property.units_count, property.occupied_units_count);
  const statusInfo = statusMap[status];

  return (
    <>
      <div className="group relative bg-white border border-slate-200/80 rounded-2xl px-4 py-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Main Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="hidden sm:flex w-12 h-12 bg-blue-50 text-blue-600 rounded-xl items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
              <Building2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {property.name}
                </h3>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ring-1 ring-inset ${statusInfo.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                  {statusInfo.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{property.location}</span>
                </span>
                <Dot size={16} className="text-slate-400 flex-shrink-0" />
                <span className="font-medium text-slate-700">
                  {property.units_count} {property.units_count === 1 ? 'Unit' : 'Units'} Total
                </span>
              </div>
            </div>
          </div>

          {/* Occupancy Indicator & Actions */}
          <div className="flex items-center justify-between lg:justify-end gap-6 border-t border-slate-100 pt-4 lg:pt-0 lg:border-t-0">
            
            {/* Occupancy Stats */}
            <div className="flex flex-col min-w-[140px]">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-500 font-medium">Occupancy</span>
                <p className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">{occupancyPercentage}%</span>
                  <span className="text-slate-500">({property.occupied_units_count}/{property.units_count})</span>
                </p>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Link
                href={`/properties/${property.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all active:scale-95"
              >
                <span>Manage</span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>

              {/* Dropdown Menu */}
              <Menu as="div" className="relative">
                <MenuButton 
                  aria-label="Property options"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                >
                  <MoreVertical className="w-4 h-4" />
                </MenuButton>
                
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-in"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-slate-200 rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none z-50 py-1 divide-y divide-slate-100">
                    <div className="py-0.5">
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={() => propertyModal.open(property, true)}
                            className={`${
                              active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                            } flex w-full items-center px-3.5 py-2 text-xs font-medium transition-colors`}
                          >
                            <Edit2 className="mr-2.5 h-3.5 w-3.5 text-slate-400" /> 
                            Edit Property
                          </button>
                        )}
                      </MenuItem>
                    </div>
                    <div className="py-0.5">
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleDeactivateClick}
                            className={`${
                              active ? 'bg-rose-50 text-rose-700' : 'text-rose-600'
                            } flex w-full items-center px-3.5 py-2 text-xs font-medium transition-colors`}
                          >
                            <Trash2 className="mr-2.5 h-3.5 w-3.5 text-rose-500" /> 
                            Deactivate Property
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
      </div>

      <ConfirmModal
        isOpen={isDeactivateModalOpen}
        icon={<AlertTriangle size={24} className="text-rose-600" />}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleConfirmDeactivate}
        isLoading={updateProperty.isPending}
        title="Deactivate Property"
        detail={deactivateError}
        message="Are you sure you want to deactivate this property?"
        message2="The property will be removed from your active portfolio, but historical tenancy records will be retained."
        disableConfirm={updateProperty.isPending || deactivateError !== null}
        confirmText="Deactivate"
      />
    </>
  );
};

export default PropertyCard;