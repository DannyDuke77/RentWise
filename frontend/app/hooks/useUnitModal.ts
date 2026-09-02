import { create } from "zustand";
import { Property, Unit } from "@/app/src/types/Types";

interface UnitModalStore {
    property: Property | null;
    unit?: Unit | null;
    isEditing: boolean;

    isOpen: boolean;
    open: (property: Property, unit?: Unit | null, isEditing?: boolean) => void;
    close: () => void;
}

const useUnitModal = create<UnitModalStore>((set) => ({
    property: null,
    unit: null,
    isEditing: false,

    isOpen: false,
    open: (property, unit, isEditing) => set({ isOpen: true, property, unit, isEditing }),
    close: () => set({ isOpen: false, property: null, unit: null, isEditing: false }),
}));

export default useUnitModal;