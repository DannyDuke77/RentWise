'use client';

import useUnitModal from "@/app/hooks/useUnitModal";
import { Home } from "lucide-react";

interface AddUnitButtonProps {
    property: {
        id: string,
        name: string
    }
}

const AddUnitButton: React.FC<AddUnitButtonProps> = ({ property }) => {
    const unitModal = useUnitModal();

    return (
        <button 
            onClick={() => unitModal.open(property.id, property.name)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >   
            <Home className="w-4 h-4" />
            Add Unit
        </button>
    )
}

export default AddUnitButton