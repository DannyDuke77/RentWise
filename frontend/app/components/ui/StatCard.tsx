interface StatCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: 'blue' | 'rose' | 'emerald' | 'purple';
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const StatCard = ({ label, value, icon, color, subtitle, action }: StatCardProps) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-100', hover: 'hover:border-blue-200' },
        rose: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', iconBg: 'bg-rose-100', hover: 'hover:border-rose-200' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-100', hover: 'hover:border-emerald-200' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', iconBg: 'bg-purple-100', hover: 'hover:border-purple-200' },
    };

    const colors = colorClasses[color];

    return (
        <div className={`p-5 rounded-lg border ${colors.bg} ${colors.border} ${colors.hover} transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="md:text-2xl font-black text-gray-800 mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                    <div className={colors.text}>{icon}</div>
                </div>
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className={`mt-3 text-sm font-bold ${colors.text} hover:opacity-80 transition-opacity flex items-center gap-1`}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default StatCard;