import { ChevronRight } from "lucide-react";
import { Property, Unit } from "@/app/src/types/Types";
import Link from "next/link";

interface ViewUnitButtonProps {
    property: Property;
    unit: Unit;
}
const ViewUnitButton: React.FC<ViewUnitButtonProps> = ({ property, unit }) => {

    return(
        <Link 
            href={`/properties/${property.id}/units/${unit.id}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors duration-200">
          <span className="text-sm font-medium">View</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
    );
}

export default ViewUnitButton