import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: string;
  bg?: string;
  ring?: string;
  isPending?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon,
  color = "text-blue-600",
  bg = "bg-blue-50",
  ring = "ring-blue-500/10",
  isPending
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${bg} ${color} ring-1 ring-inset ${ring}`}>
          <Icon size={18} />
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </p>
      </div>
      
      {isPending ? (
        <div className="w-16 h-8 bg-slate-200 animate-pulse rounded-md"></div>
      ) : (
        <div className="">
          <p className={`text-2xl md:text-3xl font-bold text-slate-900 tracking-tight`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>        
        </div>
      )}
    </div>
  );
};

export default StatCard;