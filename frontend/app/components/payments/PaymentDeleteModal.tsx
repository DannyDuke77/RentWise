'use client';

import { Loader2, Trash2 } from "lucide-react";
import ConfirmModal from "@/app/components/modals/ConfirmModal";
import { Payment } from "@/app/src/types/Types";

interface PaymentDeleteModalProps {
    isOpen: boolean;
    payment: Payment | null;
    isPending: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

const PaymentDeleteModal = ({ 
    isOpen, 
    payment, 
    isPending, 
    onConfirm, 
    onClose 
}: PaymentDeleteModalProps) => {
    if (!payment) return null;

    return (
        <ConfirmModal
            isOpen={isOpen}
            icon={<Trash2 className="w-6 h-6 text-red-500" />}
            title="Delete Payment"
            detail={
                <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                        Reference: <span className="font-mono font-medium">{payment.reference || 'N/A'}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Amount: <span className="font-medium">KES {Number(payment.amount_paid).toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Date: {new Date(payment.paid_on).toLocaleDateString()}
                    </p>
                </div>
            }
            message="Are you sure you want to delete this payment?"
            message2="This action cannot be undone."
            onConfirm={onConfirm}
            onClose={onClose}
            confirmText="Delete Payment"
            isLoading={isPending}
        />
    );
};

export default PaymentDeleteModal;