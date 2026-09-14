'use client';

import { RefreshCcw, AlertCircle, Check, CircleX, X } from "lucide-react";
import Modal from "@/app/components/ui/Modal";

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isPending: boolean;
    errors: Record<string, string[]>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    refundCategory: "rent" | "deposit";
    refundAmount: number;
    setRefundAmount: (value: number) => void;
    refundMethod: string;
    setRefundMethod: (value: string) => void;
    refundReference: string;
    setRefundReference: (value: string) => void;
    refundCap: number;
    isValidMpesa: (ref: string) => boolean;
}

export const RefundModal = ({
    isOpen,
    onClose,
    onConfirm,
    isPending,
    errors,
    setErrors,
    refundCategory,
    refundAmount,
    setRefundAmount,
    refundMethod,
    setRefundMethod,
    refundReference,
    setRefundReference,
    refundCap,
    isValidMpesa,
}: RefundModalProps) => {
    const handleMethodChange = (method: string) => {
        setRefundMethod(method);
        if (method) {
            setRefundReference("");
            setErrors(prev => ({
                ...prev,
                payment_method: [],
                reference: []
            }));
        }
    }

    const content = (
        <div className="p-6 space-y-6">
            <div className="text-center space-y-2">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    refundCategory === "deposit" 
                        ? 'bg-gradient-to-br from-purple-100 to-purple-200' 
                        : 'bg-gradient-to-br from-emerald-100 to-emerald-200'
                }`}>
                    <RefreshCcw className={`w-10 h-10 ${
                        refundCategory === "deposit" ? 'text-purple-600' : 'text-emerald-600'
                    }`} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                    {refundCategory === "deposit" ? "Refund Security Deposit" : "Process Credit Refund"}
                </h3>
                <p className="text-gray-500">
                    {refundCategory === "deposit" 
                        ? "Returning held deposit to the tenant" 
                        : "Returning credit balance to the tenant"}
                </p>
                <div className="inline-block px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-600">
                    Available: KES {refundCap.toLocaleString()}
                </div>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="text-sm font-bold text-gray-600 block mb-1.5">
                        Refund Amount <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">KES</span>
                        <input
                            type="number"
                            className={`w-full pl-16 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none transition-all font-bold text-lg ${
                                refundCategory === "deposit" 
                                    ? 'border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-purple-700' 
                                    : 'border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 text-emerald-700'
                            }`}
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(Math.min(Number(e.target.value), refundCap))}
                        />
                    </div>
                    {errors.amount_paid && errors.amount_paid.length > 0 && (
                        <p className="text-sm font-semibold text-rose-500 flex items-center gap-1.5 mt-1.5">
                            <AlertCircle className="w-4 h-4" />
                            {errors.amount_paid[0]}
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-bold text-gray-600 block mb-1.5">
                        Refund Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                        className="w-full p-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
                        value={refundMethod}
                        onChange={(e) => handleMethodChange(e.target.value)}
                    >
                        <option value="">Select Method</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cash">Cash</option>
                    </select>
                    {errors.payment_method && errors.payment_method.length > 0 && (
                        <p className="text-sm font-semibold text-rose-500 flex items-center gap-1.5 mt-1.5">
                            <AlertCircle className="w-4 h-4" />
                            {errors.payment_method[0]}
                        </p>
                    )}
                </div>

                {(refundMethod === "mpesa" || refundMethod === "bank") && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                        <label className="text-sm font-bold text-gray-600 flex justify-between">
                            <span>Reference <span className="text-rose-500">*</span></span>
                            {refundMethod === "mpesa" && refundReference && (
                                <span className={isValidMpesa(refundReference) ? 'text-emerald-600' : 'text-rose-500'}>
                                    {isValidMpesa(refundReference) ? (
                                        <p className="flex items-center gap-1.5">
                                            <Check className="w-4 h-4" />
                                            Valid ()
                                        </p>
                                        
                                    ) : (
                                        <p className="flex items-center gap-1.5">
                                            <X className="w-4 h-4" />
                                            Invalid
                                        </p>
                                    )}
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            placeholder={refundMethod === 'mpesa' ? "e.g. RQB7TX890Z" : "Bank Reference"}
                            maxLength={refundMethod === 'mpesa' ? 10 : 20}
                            className={`w-full p-3.5 border-2 rounded-xl outline-none transition-all font-mono uppercase ${
                                refundMethod === 'mpesa' && refundReference
                                    ? isValidMpesa(refundReference) 
                                        ? 'border-emerald-400 bg-emerald-50/30' 
                                        : 'border-rose-400 bg-rose-50/30'
                                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                            }`}
                            value={refundReference}
                            onChange={e => setRefundReference(e.target.value.toUpperCase().trim())}
                        />
                        {errors.reference && errors.reference.length > 0 && (
                            <p className="text-sm font-semibold text-rose-500 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" />
                                {errors.reference[0]}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                    onClick={onClose}
                    className="flex-1 py-3.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isPending}
                    className={`flex-1 py-3.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        refundCategory === "deposit" 
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-600/30' 
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/30'
                    }`}
                >
                    {isPending ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        'Confirm Refund'
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            close={onClose}
            label={refundCategory === "deposit" ? "Refund Security Deposit" : "Process Credit Refund"}
            content={content}
            maxWidth="max-w-lg"
        />
    );
};