import React, { useState } from 'react';
import apiService from '@/app/services/apiService';

interface CustomReportModalProps {
  propertyId: string;
  propertyName: string;
  onClose: () => void;
}

const CustomReportModal: React.FC<CustomReportModalProps> = ({ propertyId, propertyName, onClose }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await apiService.getBlob(
        `/api/properties/${propertyId}/audit-report/?month=${month}&year=${year}`
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${propertyName}_Audit_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (error) {
      alert("Failed to generate report. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Generate Audit Report</h2>
        <p className="text-sm text-gray-600 mb-6">Select the period for {propertyName}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Month</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full mt-1 border rounded p-2"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full mt-1 border rounded p-2"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomReportModal;