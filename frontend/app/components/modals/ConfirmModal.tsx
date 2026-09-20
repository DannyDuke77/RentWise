'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    icon: React.ReactNode;
    title: string;
    detail?: string | null | React.ReactNode;
    message: string;
    message2?: string;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    confirmColor?: string;
    disableConfirm?: boolean;
    isLoading?: boolean;
}

const ConfirmModal = ({ 
    isOpen, icon, title, detail, message, message2, onConfirm, onClose, confirmText, confirmColor, disableConfirm, isLoading 
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg flex items-center gap-2">
                            {icon} <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mb-4">
                        {detail}
                    </div>
                    
                    <p className="text-gray-500 leading-relaxed">{message}</p>
                    <p className="text-gray-500 leading-relaxed mt-2">{message2}</p>
                </div>

                <div className="bg-gray-50 p-4 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading || disableConfirm}
                        className={`flex-1 py-2.5 text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 ${confirmColor ? confirmColor : 'bg-red-600 hover:bg-red-700'}`}
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