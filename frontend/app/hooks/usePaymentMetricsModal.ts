import { create } from "zustand";

interface PaymentVisualizationModalStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const usePaymentVisualizationModal = create<PaymentVisualizationModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export default usePaymentVisualizationModal;