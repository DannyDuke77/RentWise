"use client";

import React, { useState } from 'react';
import apiService from '@/app/services/apiService';
import { FileText, X } from 'lucide-react';

interface PropertyAuditModalProps {
    propertyId: string;
    propertyName: string;
    isOpen: boolean;
    onClose: () => void;
}

const PropertyAuditModal: React.FC<PropertyAuditModalProps> = ({ 
    propertyId, 
    propertyName, 
    isOpen, 
    onClose 
}) => {
    const today = new Date().toISOString().split('T')[0];
    const [range, setRange] = useState({ start: today, end: today });
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        // URL updated to include /api prefix
        const url = `/api/properties/${propertyId}/audit-report/?start_date=${range.start}&end_date=${range.end}`;
        
        try {
            const blob = await apiService.getBlob(url);
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `Ledger_${propertyName}_${range.start} to ${range.end}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            onClose();
        } catch (error) {
            alert("Download failed. Check backend logs.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-lg font-bold">Generate Transaction Ledger</h3>
                        <p className="text-xs text-gray-400">{propertyName}</p>
                    </div>
                    <button onClick={onClose} className="hover:text-red-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-black uppercase text-gray-500 mb-1">From Date</label>
                        <input 
                            type="date" 
                            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={range.start}
                            onChange={(e) => setRange({ ...range, start: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-black uppercase text-gray-500 mb-1">To Date</label>
                        <input 
                            type="date" 
                            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={range.end}
                            onChange={(e) => setRange({ ...range, end: e.target.value })}
                        />
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex flex-col gap-2">
                    <button 
                        onClick={handleDownload}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <FileText className="w-4 h-4" />
                        {loading ? 'Processing...' : 'Download PDF Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PropertyAuditModal;