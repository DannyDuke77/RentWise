'use client';

import React, { useEffect, useState, useCallback } from "react";
import {
    CreditCard, Shield, Info, AlertCircle, Calendar,
    CheckCircle2, X, MousePointer, ChevronDown, Edit, Lock
} from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { Payment } from "@/app/src/types/Types";
import { useToday } from "@/app/src/utils/timeStore";

export type PaymentModalMode = 'create' | 'edit' | 'view';

export interface PaymentFormPayload {
    amount_paid: number;
    payment_method: string;
    reference: string;
    category: "rent" | "deposit";
    notes: string;
    paid_on: string;
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: PaymentModalMode;
    isPending: boolean;
    errors: Record<string, string[]>;
    isValidMpesa: (ref: string) => boolean;
    payment?: Payment | null;

    /**
     * Called when the user submits in create or edit mode.
     * For 'create', payload contains the newly entered values.
     * For 'edit', payload contains the edited values (including this payment's id via `payment`).
     */
    onSubmit: (payload: PaymentFormPayload) => void;

    // Controlled props — only used in 'create' mode.
    // In 'edit'/'view' modes the modal owns its form state, seeded from `payment`.
    paymentCategory?: "rent" | "deposit";
    setPaymentCategory?: (category: "rent" | "deposit") => void;
    amount?: string;
    setAmount?: (value: string) => void;
    paymentMethod?: string;
    setPaymentMethod?: (value: string) => void;
    reference?: string;
    setReference?: (value: string) => void;
    paymentDate?: string;
    setPaymentDate?: (value: string) => void;
    notes?: string;
    setNotes?: (value: string) => void;
    message?: string;
    setMessage?: (value: string) => void;

    /** Notifies parent when the user enables editing from view mode. */
    onEnableEdit?: () => void;
}

export const PaymentModal = ({
    isOpen,
    onClose,
    mode,
    isPending,
    errors,
    isValidMpesa,
    payment,
    onSubmit,

    paymentCategory: controlledCategory,
    setPaymentCategory: setControlledCategory,
    amount: controlledAmount,
    setAmount: setControlledAmount,
    paymentMethod: controlledMethod,
    setPaymentMethod: setControlledMethod,
    reference: controlledReference,
    setReference: setControlledReference,
    paymentDate: controlledDate,
    setPaymentDate: setControlledDate,
    notes: controlledNotes,
    setNotes: setControlledNotes,
    message: controlledMessage,
    setMessage: setControlledMessage,

    onEnableEdit,
}: PaymentModalProps) => {
    const today = useToday();

    // Internal state for edit/view modes (seeded from `payment`)
    const [internalCategory, setInternalCategory] = useState<"rent" | "deposit">("rent");
    const [internalAmount, setInternalAmount] = useState("");
    const [internalMethod, setInternalMethod] = useState("");
    const [internalReference, setInternalReference] = useState("");
    const [internalDate, setInternalDate] = useState("");
    const [internalNotes, setInternalNotes] = useState("");
    const [internalMessage, setInternalMessage] = useState("");

    const [editEnabled, setEditEnabled] = useState(false);

    const isControlled = mode === 'create';

    // Resolved values
    const category = isControlled ? (controlledCategory ?? "rent") : internalCategory;
    const amount = isControlled ? (controlledAmount ?? "") : internalAmount;
    const method = isControlled ? (controlledMethod ?? "") : internalMethod;
    const reference = isControlled ? (controlledReference ?? "") : internalReference;
    const date = isControlled ? (controlledDate ?? "") : internalDate;
    const notes = isControlled ? (controlledNotes ?? "") : internalNotes;
    const message = isControlled ? (controlledMessage ?? "") : internalMessage;

    const setCategory = isControlled ? setControlledCategory : setInternalCategory;
    const setAmount = isControlled ? setControlledAmount : setInternalAmount;
    const setMethod = isControlled ? setControlledMethod : setInternalMethod;
    const setReference = isControlled ? setControlledReference : setInternalReference;
    const setDate = isControlled ? setControlledDate : setInternalDate;
    const setNotes = isControlled ? setControlledNotes : setInternalNotes;
    const setMessage = isControlled ? setControlledMessage : setInternalMessage;

    // Seed internal state from payment when opening in edit/view mode
    useEffect(() => {
        if (!isOpen || isControlled || !payment) return;

        setInternalAmount(String(payment.amount_paid ?? ''));
        setInternalCategory((payment.category as "rent" | "deposit") ?? 'rent');
        setInternalMethod(payment.payment_method ?? '');
        setInternalReference(payment.reference ?? '');
        setInternalDate(payment.paid_on?.split('T')[0] ?? '');
        setInternalNotes(payment.notes ?? '');
        setInternalMessage('');
        setEditEnabled(mode === 'edit');
    }, [isOpen, isControlled, payment, mode]);

    const isReadOnly = mode === 'view' && !editEnabled;
    const isEditing = mode === 'edit' || (mode === 'view' && editEnabled);

    const handleToggleEdit = useCallback(() => {
        const next = !editEnabled;
        setEditEnabled(next);
        if (next) onEnableEdit?.();
    }, [editEnabled, onEnableEdit]);

    const handleClose = () => {
        if (isControlled) {
            // Reset create-mode form on close
            setAmount?.('');
            setCategory?.('rent');
            setMethod?.('');
            setReference?.('');
            setNotes?.('');
            setDate?.(today.toISOString().split('T')[0]);
            setMessage?.('');
        }
        setEditEnabled(false);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        const payload: PaymentFormPayload = {
            amount_paid: Number(amount) || 0,
            payment_method: method,
            reference,
            category,
            notes: notes.trim(),
            paid_on: date,
        };

        onSubmit(payload);
    };

    const getTitle = () => {
        if (mode === 'create') return 'New Payment';
        if (mode === 'edit') return 'Edit Payment';
        return editEnabled ? 'Edit Payment' : 'Payment Details';
    };

    const content = (
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {/* Mode banner */}
            {mode !== 'create' && payment && (
                <div className={`flex items-start justify-between gap-3 p-3 border rounded-xl ${
                    isReadOnly
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-blue-50 border-blue-200'
                }`}>
                    <div className="flex items-start gap-3">
                        {isReadOnly ? (
                            <Lock className="w-5 h-5 text-gray-500 mt-0.5" />
                        ) : (
                            <Edit className="w-5 h-5 text-blue-600 mt-0.5" />
                        )}
                        <div>
                            <p className={`text-sm font-medium ${isReadOnly ? 'text-gray-700' : 'text-blue-800'}`}>
                                {isReadOnly ? 'Read-only view' : 'Editing Payment'}
                            </p>
                            <p className={`text-xs ${isReadOnly ? 'text-gray-500' : 'text-blue-600'}`}>
                                Reference: <span className="font-mono">{payment.reference || 'N/A'}</span>
                                {' • '}
                                Date: {new Date(payment.paid_on).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {mode === 'view' && (
                        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                            <input
                                type="checkbox"
                                checked={editEnabled}
                                onChange={handleToggleEdit}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Enable editing
                            </span>
                        </label>
                    )}
                </div>
            )}

            {/* Category */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Payment Type</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => !isReadOnly && setCategory?.("rent")}
                        disabled={isReadOnly}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-lg text-sm font-bold border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                            category === "rent"
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <CreditCard className="w-4 h-4" />
                        Rent / Charges
                    </button>
                    <button
                        type="button"
                        onClick={() => !isReadOnly && setCategory?.("deposit")}
                        disabled={isReadOnly}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-lg text-sm font-bold border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                            category === "deposit"
                                ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/30"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <Shield className="w-4 h-4" />
                        Security Deposit
                    </button>
                </div>
                {category === "deposit" && (
                    <p className="text-sm text-purple-600 font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Tracked separately from rent. Will not clear existing rent arrears.
                    </p>
                )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600">
                        Amount <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <input
                            type="number"
                            placeholder="0.00"
                            disabled={isReadOnly}
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl outline-none transition-all text-gray-800 font-bold disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
                                errors.amount_paid
                                    ? 'border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-200'
                                    : 'bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                            }`}
                            value={amount}
                            onChange={e => setAmount?.(e.target.value)}
                        />
                    </div>
                    {errors.amount_paid && errors.amount_paid.length > 0 && (
                        <p className="text-sm font-semibold text-rose-500 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            {errors.amount_paid[0]}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600">
                        Method <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <MousePointer className="w-4 h-4" />
                        </div>
                        <select
                            disabled={isReadOnly}
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl outline-none transition-all appearance-none text-sm font-bold text-gray-800 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
                                errors.payment_method
                                    ? 'border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-200'
                                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                            }`}
                            value={method}
                            onChange={e => setMethod?.(e.target.value)}
                        >
                            <option value="">Select Method</option>
                            <option value="mpesa">M-Pesa</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cash">Cash</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {errors.payment_method && errors.payment_method.length > 0 && (
                        <p className="text-sm font-semibold text-rose-500 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            {errors.payment_method[0]}
                        </p>
                    )}
                </div>

                {(method === "mpesa" || method === "bank") && (
                    <div className="md:col-span-2 space-y-1.5 animate-in fade-in duration-200">
                        <label className="text-sm font-bold text-gray-600 flex justify-between">
                            <span>Reference Code <span className="text-rose-500">*</span></span>
                            {method === "mpesa" && reference && (
                                <span className={isValidMpesa(reference) ? 'text-emerald-600' : 'text-rose-500'}>
                                    {isValidMpesa(reference) ? '✓ Valid' : '✗ Invalid (10 chars)'}
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            placeholder={method === 'mpesa' ? "e.g. RQB7TX890Z" : "Bank Reference"}
                            maxLength={10}
                            disabled={isReadOnly}
                            className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-sm font-mono uppercase disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
                                method === 'mpesa' && reference
                                    ? isValidMpesa(reference)
                                        ? 'border-emerald-400 bg-emerald-50/30 focus:ring-4 focus:ring-emerald-200'
                                        : 'border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-200'
                                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                            }`}
                            value={reference}
                            onChange={e => setReference?.(e.target.value.toUpperCase().trim())}
                        />
                        {errors.reference && (
                            <p className="text-sm font-semibold text-rose-500 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" />
                                {errors.reference[0]}
                            </p>
                        )}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600">Payment Date</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <input
                            type="date"
                            disabled={isReadOnly}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                            value={date}
                            onChange={e => setDate?.(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600">Notes</label>
                    <textarea
                        rows={3}
                        disabled={isReadOnly}
                        className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        value={notes}
                        onChange={e => setNotes?.(e.target.value)}
                        placeholder="Optional notes..."
                    />
                </div>
            </div>

            {message && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-800">{message}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMessage?.('')}
                        className="p-1 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-emerald-600" />
                    </button>
                </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    {isReadOnly ? 'Close' : 'Cancel'}
                </button>
                {!isReadOnly && (
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <span className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {isEditing ? 'Updating...' : 'Processing...'}
                            </span>
                        ) : (
                            isEditing ? 'Update Payment' : `Confirm ${category === 'deposit' ? 'Deposit' : 'Payment'}`
                        )}
                    </button>
                )}
            </div>
        </form>
    );

    return (
        <Modal
            isOpen={isOpen}
            close={handleClose}
            label={getTitle()}
            content={content}
            maxWidth="max-w-2xl"
        />
    );
};