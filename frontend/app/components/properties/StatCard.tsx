import { 
  Building2, 
  Home, 
  UserCheck, 
  UserMinus, 
  Wrench 
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
}

// Mapping titles to icons and colors for better visual cues
const iconMap: Record<string, { icon: any, color: string, bg: string }> = {
  "Total Properties": { icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
  "Total Units": { icon: Home, color: "text-indigo-600", bg: "bg-indigo-50" },
  "Occupied Units": { icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Vacant Units": { icon: UserMinus, color: "text-amber-600", bg: "bg-amber-50" },
  "Units in Maintenance": { icon: Wrench, color: "text-rose-600", bg: "bg-rose-50" },
};

const StatCard = ({ title, value }: StatCardProps) => {
  const config = iconMap[title] || { icon: Building2, color: "text-gray-600", bg: "bg-gray-50" };
  const Icon = config.icon;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
          <Icon size={18} />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {title}
        </p>
      </div>
      
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">
          {value.toLocaleString()}
        </p>
        {/* Optional: You can add trend indicators here later */}
      </div>
    </div>
  );
};

export default StatCard;