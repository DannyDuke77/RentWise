import { create } from "zustand";

interface UnitModalStore {
    propertyId: string | null;
    propertyName: string | null;
    isOpen: boolean;
    open: (propertyId: string, propertyName: string) => void;
    close: () => void;
}

const useUnitModal = create<UnitModalStore>((set) => ({
    propertyId: null,
    propertyName: null,
    isOpen: false,
    open: (propertyId: string, propertyName: string) => set({ isOpen: true, propertyId, propertyName }),
    close: () => set({ isOpen: false, propertyId: null, propertyName: null }),
}));

export default useUnitModal;