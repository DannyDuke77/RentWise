'use client';

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
    label: string;
    close: () => void;
    content: React.ReactElement;
    isOpen: boolean;
    maxWidth?: string;
    maxHeight?: string;
}

const Modal: React.FC<ModalProps> = ({ label, close, content, isOpen, maxWidth, maxHeight }) => {
    const [showModal, setShowModal] = useState(isOpen);

    useEffect(() => {
        setShowModal(isOpen);
        
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setShowModal(false);
        setTimeout(() => {
            close();
        }, 300);
    }, [close]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/50 backdrop-blur-[4px] transition-opacity duration-500 ${
                    showModal ? 'opacity-100' : 'opacity-0'
                }`}
            />
            
            {/* Modal */}
            <div className={`relative w-full ${maxWidth || 'max-w-2xl'} transition-all duration-300 ${
                showModal 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}>
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-gray-200 px-6 py-3">
                        <div className="flex">
                            <h3 className="text-lg font-semibold text-gray-900 text-center w-full">
                                {label}
                            </h3>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;