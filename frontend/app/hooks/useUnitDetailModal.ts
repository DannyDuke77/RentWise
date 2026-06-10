import { create } from "zustand";
import { UnitType } from "../components/modals/UnitModal";
import { PropertyType } from "../properties/page";

interface UnitDetailModalStore {
    property: PropertyType | null;
    unit: UnitType | null;
    isEditing: boolean;
    isOpen: boolean;
    open: (property: PropertyType, unit: UnitType, editMode?: boolean) => void;
    close: () => void;
}

const useUnitDetailModal = create<UnitDetailModalStore>((set) => ({
    property: null,
    unit: null,
    isEditing: false,
    isOpen: false,
    open: (property, unit, editMode = false) => set({ isOpen: true, property, unit, isEditing: editMode }),
    close: () => set({ isOpen: false, unit: null, isEditing: false }),
}));

export default useUnitDetailModal;