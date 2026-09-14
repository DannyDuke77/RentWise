import { useState, useCallback } from "react";
import { useDeletePayment, useUpdatePayment } from "./mutations/usePaymentMutations";
import { useToast } from "@/app/providers/ToastProvider";
import { Payment } from "@/app/src/types/Types";

export const usePaymentActions = () => {
    const { showToast } = useToast();
    const deletePaymentMutation = useDeletePayment();
    const updatePaymentMutation = useUpdatePayment();

    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isViewEditMode, setIsViewEditMode] = useState(false);

    const handleEdit = useCallback((payment: Payment) => {
        setEditingPayment(payment);
        setIsEditModalOpen(true);
    }, []);

    const handleView = useCallback((payment: Payment) => {
        setEditingPayment(payment);
        setIsViewEditMode(false);
        setIsViewModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((payment: Payment) => {
        setDeletingPayment(payment);
        setIsDeleteModalOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deletingPayment) return false;
        try {
            await deletePaymentMutation.mutateAsync({
                paymentId: deletingPayment.id,
                unitId: deletingPayment.unit.id,
                propertyId: deletingPayment.property.id,
                targetMonth: new Date(deletingPayment.paid_on).getMonth() + 1,
                targetYear: new Date(deletingPayment.paid_on).getFullYear(),
            });
            setIsDeleteModalOpen(false);
            setDeletingPayment(null);
            showToast('Payment Deleted', 'Payment deleted successfully', 'success');
            return true;
        } catch (error) {
            showToast('Error', 'Failed to delete payment', 'error');
            return false;
        }
    }, [deletingPayment, deletePaymentMutation, showToast]);

    const closeModals = useCallback(() => {
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsViewModalOpen(false);
        setIsViewEditMode(false);
        setEditingPayment(null);
        setDeletingPayment(null);
    }, []);

    const toggleViewEditMode = useCallback(() => {
        setIsViewEditMode(prev => !prev);
    }, []);

    return {
        // State
        editingPayment,
        deletingPayment,
        isEditModalOpen,
        isDeleteModalOpen,
        isViewModalOpen,
        isViewEditMode,
        // Actions
        handleEdit,
        handleView,
        handleDeleteClick,
        handleConfirmDelete,
        closeModals,
        toggleViewEditMode,
        // Mutations
        deletePaymentMutation,
        updatePaymentMutation,
    };
};