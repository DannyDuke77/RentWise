import React from "react";
import { Eye, MapPin, Layers } from "lucide-react";

interface PropertyCardProps {
  id: string;
  name: string;
  location: string;
  units: number;
  occupancy: number;
}

const statusMap = {
  full: {
    label: 'Fully Occupied',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  partial: {
    label: 'Partially Vacant',
    className: 'bg-amber-50 text-amber-700 border-amber-100'
  },
  low: {
    label: 'Mostly Vacant',
    className: 'bg-rose-50 text-rose-700 border-rose-100'
  }
};

const getStatus = (units: number, occupancy: number) => {
  if (units === 0) return 'low';
  if (occupancy === units) return 'full';
  if (occupancy > 0) return 'partial';
  return 'low';
};

const PropertyCard: React.FC<PropertyCardProps> = ({
  id,
  name,
  location,
  units,
  occupancy,
}) => {
  const status = getStatus(units, occupancy);
  const statusInfo = statusMap[status];

  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400" />
            {location}
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={14} className="text-gray-400" />
            {units} Units
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Occupancy</p>
          <p className="text-sm font-bold text-gray-700">{Math.round((occupancy / units) * 100) || 0}% Full</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${statusInfo.className}`}>
            {statusInfo.label}
          </span>

          <a
            href={`/properties/${id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
          >
            <Eye size={16} />
            View
          </a>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;