'use client';

import React, { useEffect, useState } from "react";
import {
    CreditCard, Shield, Info, AlertCircle, Calendar,
    CheckCircle2, X, MousePointer, ChevronDown, Edit, Lock
} from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { Payment } from "@/app/src/types/Types";
import { useToday } from "@/app/src/utils/timeStore";
import Toggle from "../ui/Toggle";

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
    payment: Payment | null;
    /** When true, the modal opens as a fresh "New Payment" form. */
    createMode?: boolean;
    /** When true (and not in createMode), the modal opens in edit mode. */
    startInEdit?: boolean;
    isPending: boolean;
    errors: Record<string, string[]>;
    isValidMpesa: (ref: string) => boolean;
    onSubmit: (payload: PaymentFormPayload) => void;
}

export const PaymentModal = ({
    isOpen,
    onClose,
    payment,
    createMode = false,
    startInEdit = false,
    isPending,
    errors,
    isValidMpesa,
    onSubmit,
}: PaymentModalProps) => {
    const today = useToday();

    const [category, setCategory] = useState<"rent" | "deposit">("rent");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("");
    const [reference, setReference] = useState("");
    const [date, setDate] = useState("");
    const [notes, setNotes] = useState("");
    const [message, setMessage] = useState("");
    const [editEnabled, setEditEnabled] = useState(false);

    // Seed state when the modal opens or the target payment changes.
    useEffect(() => {
        if (!isOpen) return;

        if (createMode) {
            setAmount("");
            setCategory("rent");
            setMethod("");
            setReference("");
            setDate(today.toISOString().slice(0, 16));
            setNotes("");
            setMessage("");
            setEditEnabled(true);
            return;
        }

        if (!payment) return;

        setAmount(String(payment.amount_paid ?? ""));
        setCategory((payment.category as "rent" | "deposit") ?? "rent");
        setMethod(payment.payment_method ?? "");
        setReference(payment.reference ?? "");
        setDate(payment.paid_on ? payment.paid_on.slice(0, 16) : "");
        setNotes(payment.notes ?? "");
        setMessage("");
        setEditEnabled(startInEdit);
    }, [isOpen, payment, createMode, startInEdit, today]);

    const isReadOnly = !editEnabled;

    const handleClose = () => {
        setEditEnabled(false);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        onSubmit({
            amount_paid: Number(amount) || 0,
            payment_method: method,
            reference,
            category,
            notes: notes.trim(),
            paid_on: date,
        });
    };

    if (!payment && !createMode) return null;

    const title = createMode
        ? "New Payment"
        : editEnabled
        ? "Edit Payment"
        : "Payment Details";

    const content = (
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {/* Mode banner */}
            {!createMode && payment && (
                <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border rounded-xl transition-all duration-200 ${
                        isReadOnly
                            ? "bg-slate-50 border-slate-200/80 shadow-xs"
                            : "bg-blue-50/60 border-blue-200 shadow-xs"
                    }`}
                >
                    {/* Left Side: Icon & Metadata */}
                    <div className="flex items-start gap-3 min-w-0">
                        <div
                            className={`p-2 rounded-lg shrink-0 ${
                                isReadOnly
                                    ? "bg-slate-200/60 text-slate-600"
                                    : "bg-blue-100 text-blue-700"
                            }`}
                        >
                            {isReadOnly ? (
                                <Lock className="w-4 h-4" />
                            ) : (
                                <Edit className="w-4 h-4" />
                            )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                            <p
                                className={`text-sm font-semibold leading-tight ${
                                    isReadOnly ? "text-slate-800" : "text-blue-950"
                                }`}
                            >
                                {isReadOnly ? "Read-Only Mode" : "Editing Payment"}
                            </p>

                            <div
                                className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${
                                    isReadOnly ? "text-slate-500" : "text-blue-800/80"
                                }`}
                            >
                                <span className="truncate">
                                    Ref:{" "}
                                    <span className="font-mono font-medium text-slate-700">
                                        {payment.reference || "N/A"}
                                    </span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>
                                    Date: {new Date(payment.paid_on).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Toggle Control */}
                    <label className="flex items-center justify-between sm:justify-end gap-2.5 cursor-pointer select-none shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        <span
                            className={`text-xs font-semibold tracking-wide uppercase ${
                                isReadOnly ? "text-slate-600" : "text-blue-700"
                            }`}
                        >
                            {isReadOnly ? "Enable editing" : "Editing"}
                        </span>
                        <Toggle checked={editEnabled} onChange={setEditEnabled} />
                    </label>
                </div>
            )}

            {/* Category */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Payment Type</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => !isReadOnly && setCategory("rent")}
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
                        onClick={() => !isReadOnly && setCategory("deposit")}
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
                                    ? "border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-200"
                                    : "bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            }`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    {errors.amount_paid?.[0] && (
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
                                    ? "border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-200"
                                    : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            }`}
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            <option value="">Select Method</option>
                            <option value="mpesa">M-Pesa</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cash">Cash</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {errors.payment_method?.[0] && (
                        <p className="text-sm font-semibold text-rose-500 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            {errors.payment_method[0]}
                        </p>
                    )}
                </div>

                {(method === "mpesa" || method === "bank") && (
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-sm font-bold text-gray-600 flex justify-between">
                            <span>Reference Code <span className="text-rose-500">*</span></span>
                            {method === "mpesa" && reference && (
                                <span className={isValidMpesa(reference) ? "text-emerald-600" : "text-rose-500"}>
                                    {isValidMpesa(reference) ? "✓ Valid" : "✗ Invalid (10 chars)"}
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            placeholder={method === "mpesa" ? "e.g. RQB7TX890Z" : "Bank Reference"}
                            maxLength={10}
                            disabled={isReadOnly}
                            className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-sm font-mono uppercase disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
                                method === "mpesa" && reference
                                    ? isValidMpesa(reference)
                                        ? "border-emerald-400 bg-emerald-50/30 focus:ring-4 focus:ring-emerald-200"
                                        : "border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-200"
                                    : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            }`}
                            value={reference}
                            onChange={(e) => setReference(e.target.value.toUpperCase().trim())}
                        />
                        {errors.reference?.[0] && (
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
                            type="datetime-local"
                            disabled={isReadOnly}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
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
                        onChange={(e) => setNotes(e.target.value)}
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
                        onClick={() => setMessage("")}
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
                    {isReadOnly ? "Close" : "Cancel"}
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
                                {createMode ? "Processing..." : "Updating..."}
                            </span>
                        ) : createMode ? (
                            `Confirm ${category === "deposit" ? "Deposit" : "Payment"}`
                        ) : (
                            "Update Payment"
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
            label={title}
            content={content}
            maxWidth="max-w-2xl"
        />
    );
};