import useUnitDetailModal from "@/app/hooks/useUnitDetailModal";
import { ChevronRight } from "lucide-react";
import { UnitType } from "../modals/UnitModal";

interface ViewUnitButtonProps {
    unit: UnitType;
}
const ViewUnitButton: React.FC<ViewUnitButtonProps> = ({ unit }) => {
    const unitDetailModal = useUnitDetailModal();

    return(
        <button 
            onClick={() => unitDetailModal.open(unit)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors duration-200">
          <span className="text-sm font-medium">View</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
    );
}

export default ViewUnitButton