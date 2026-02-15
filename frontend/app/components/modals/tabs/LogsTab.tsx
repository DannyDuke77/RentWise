'use client';

import React from "react";
import { History, UserCircle, ArrowRight, Clock } from "lucide-react";

interface LogsTabProps {
    unit: any;
    loading: boolean;
}

const LogsTab: React.FC<LogsTabProps> = ({ unit, loading }) => {

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl w-full" />
                ))}
            </div>
        );
    }

    const logs = unit?.change_logs || [];

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Audit Trail</h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">
                    {logs.length} EVENTS
                </span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl max-w-[100vw] overflow-x-auto  shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase">
                        <tr>
                            <th className="p-4 border-b">Action</th>
                            <th className="p-4 border-b text-center">Value Change</th>
                            <th className="p-4 border-b text-right">Performed By</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {logs.length > 0 ? (
                            logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-700 capitalize text-xs">
                                            {log.field_name.replace('_', ' ')}
                                        </p>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                            <Clock size={10} />
                                            {new Date(log.created_at).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 line-through">
                                                {log.old_value || 'None'}
                                            </span>
                                            <ArrowRight size={12} className="text-gray-300" />
                                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                                                {log.new_value}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="text-right">
                                                <p className="text-[12px] font-bold text-gray-700">{log.changed_by_name || 'Admin'}</p>
                                                <p className="text-[8px] text-gray-400 uppercase tracking-tighter font-bold">Managed Action</p>
                                            </div>
                                            <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <UserCircle size={16} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <History className="text-gray-200" size={32} />
                                        <p className="text-xs text-gray-400 font-medium">No activity recorded yet.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LogsTab;