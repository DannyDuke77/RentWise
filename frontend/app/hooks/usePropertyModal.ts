import { create } from "zustand";
import { Property } from "@/app/src/types/Types";

interface PropertyModalStore {
    property?: Property | null;
    isEditing: boolean;

    isOpen: boolean;
    open: (property?: Property, isEditing?: boolean) => void;
    close: () => void;
}

const usePropertyModal = create<PropertyModalStore>((set) => ({
    property: null,
    isEditing: false,

    isOpen: false,
    open: (property, isEditing) => set({ isOpen: true, property, isEditing }),
    close: () => set({ isOpen: false, property: null, isEditing: false }),
}));

export default usePropertyModal;