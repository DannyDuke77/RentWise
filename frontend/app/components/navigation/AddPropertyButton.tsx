'use client';

import usePropertyModal from "@/app/hooks/usePropertyModal";
import { Property } from "@/app/src/types/Types";
import { Home } from "lucide-react";

const AddPropertyButton = () => {
    const propertyModal = usePropertyModal();

    return (
        <button 
            onClick={() => propertyModal.open(null, false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >   
            <Home className="w-4 h-4" />
            Add Property
        </button>
    )
}

export default AddPropertyButton;