'use client';

import usePropertyModal from "@/app/hooks/usePropertyModal";
import { useBusiness } from "@/app/providers/BusinessProvider";
import { useToast } from "@/app/providers/ToastProvider";
import { Home } from "lucide-react";

const AddPropertyButton = () => {
    const { activeBusinessRole } = useBusiness();
    const propertyModal = usePropertyModal();

    const { showToast } = useToast();

    const handleClick = () => {
        if (!activeBusinessRole || !['manager', 'owner'].includes(activeBusinessRole)) {
            showToast('Permission Denied', 'Only owners and managers can add properties.', 'error');
            return;
        }
        propertyModal.open();
    }

    return (
        <button 
            onClick={handleClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >   
            <Home className="w-4 h-4" />
            Add Property
        </button>
    )
}

export default AddPropertyButton;