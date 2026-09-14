'use client';

import useUnitModal from "@/app/hooks/useUnitModal";
import { Property } from "@/app/src/types/Types";
import { Plus } from "lucide-react";

interface AddUnitButtonProps {
    property: Property,
}

const AddUnitButton: React.FC<AddUnitButtonProps> = ({ property }) => {
    const unitModal = useUnitModal();

    return (
        <button 
            onClick={() => unitModal.open(property, null , false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >   
            <Plus className="w-4 h-4" />
            Add Unit
        </button>
    )
}

export default AddUnitButton