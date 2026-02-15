'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    isLoading?: boolean;
}

const ConfirmModal = ({ 
    isOpen, title, message, onConfirm, onClose, confirmText = "Delete", isLoading 
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
                </div>

                <div className="bg-gray-50 p-4 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;