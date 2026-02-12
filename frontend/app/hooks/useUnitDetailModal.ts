import { create } from "zustand";
import { UnitType } from "../components/modals/UnitModal";

interface UnitDetailModalStore {
    unit: UnitType | null;
    isEditing: boolean;
    isOpen: boolean;
    open: (unit: UnitType, editMode?: boolean) => void;
    close: () => void;
}

const useUnitDetailModal = create<UnitDetailModalStore>((set) => ({
    unit: null,
    isEditing: false,
    isOpen: false,
    open: (unit, editMode = false) => set({ isOpen: true, unit, isEditing: editMode }),
    close: () => set({ isOpen: false, unit: null, isEditing: false }),
}));

export default useUnitDetailModal;