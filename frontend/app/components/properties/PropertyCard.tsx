import React, { useState } from "react";
import { Eye, MapPin, Layers, MoreVertical, Trash2, Edit2, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import usePropertyModal from "@/app/hooks/usePropertyModal";
import { Property } from "@/app/src/types/Types";
import { useUpdateProperty } from "@/app/hooks/mutations/usePropertyMutations";
import ConfirmModal from "../modals/ConfirmModal";

interface PropertyCardProps {
  property: Property;
}

const statusMap = {
  full: {
    label: 'Fully Occupied',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  partial: {
    label: 'Partially Vacant',
    className: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  low: {
    label: 'Mostly Vacant',
    className: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};

const getStatus = (units: number, occupied_units: number) => {
  if (units === 0) return 'low';
  if (occupied_units === units) return 'full';
  if (occupied_units > 0) return 'partial';
  return 'low';
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const propertyModal = usePropertyModal();
  const updateProperty = useUpdateProperty();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isPropertyOccupied = property.occupied_units_count > 0;

  const handleDeleteClick = () => {
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!property || isPropertyOccupied) return;

    try {
      await updateProperty.mutateAsync({ 
        propertyId: property.id,
        payload: { is_active: false } 
      });
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error("Error deleting property:", error);
      const backendMessage = error?.response?.data?.detail
        || (Array.isArray(error?.response?.data) ? error.response.data[0] : null)
        || error?.message
        || "Something went wrong while deleting this property. Please try again.";
      setDeleteError(backendMessage);
    }
  };
  
  const status = getStatus(property.units_count, property.occupied_units_count);
  const statusInfo = statusMap[status];

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Section - Property Info */}
          <div className="flex items-start gap-4">
            {/* Property Icon */}
            <div className="hidden sm:flex w-12 h-12 bg-blue-50 rounded-xl items-center justify-center flex-shrink-0">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="space-y-1.5 min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {property.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{property.location}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers size={14} className="text-gray-400 flex-shrink-0" />
                  {property.units_count} Units
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            {/* Occupancy Stats - Desktop */}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Occupancy</p>
              <p className="text-sm font-semibold text-gray-700">
                {property.units_count > 0 
                  ? `${Math.round((property.occupied_units_count / property.units_count) * 100)}% Full`
                  : '0% Full'
                }
              </p>
            </div>

            {/* Status Badge & Actions */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${statusInfo.className}`}>
                {statusInfo.label}
              </span>

              <Link
                href={`/properties/${property.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">View</span>
              </Link>

              {/* Dropdown Menu */}
              <Menu as="div" className="relative">
                <MenuButton className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </MenuButton>
                
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-in"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <MenuItems className="absolute right-0 mt-2 w-40 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 py-1">
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={() => propertyModal.open(property, true)}
                          className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                        >
                          <Edit2 className="mr-3 h-4 w-4" /> 
                          Edit Property
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={handleDeleteClick}
                          className={`${active ? 'bg-rose-50 text-rose-700' : 'text-gray-700'} group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                        >
                          <Trash2 className="mr-3 h-4 w-4" /> 
                          Delete Property
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        icon={<AlertTriangle size={28} className={isPropertyOccupied ? 'text-amber-600' : 'text-red-600'} />}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={updateProperty.isPending}
        title={isPropertyOccupied ? 'Property Has Active Tenancies' : 'Remove Property'}
        detail={
          isPropertyOccupied ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 text-sm">
                    Property can't be removed
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    This property currently has active tenancies. Terminate any active tenancies before removing the property.
                  </p>
                  <Link
                    href={`/properties/${property.id}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View Property <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : deleteError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            </div>
          ) : null
        }
        message={deleteError || isPropertyOccupied ? "" : "Remove this property from your portfolio?"}
        message2={deleteError || isPropertyOccupied ? "" : "The property will no longer appear in your active properties."}
        disableConfirm={updateProperty.isPending || deleteError !== null || isPropertyOccupied}
        confirmText="Remove Property"
      />
    </>
  );
};

export default PropertyCard;