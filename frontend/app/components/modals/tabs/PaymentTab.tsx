'use client';

import React, { useEffect, useMemo, useState } from "react";
import { 
    Receipt, Calendar, XCircle, Info, ArrowUpRight, 
    ArrowDownLeft, RefreshCcw, ChevronDown, ChevronUp, Plus ,
    Download, FileSpreadsheet, FileDown,
    AlertCircle,
    X
} from "lucide-react";
import apiService from "@/app/services/apiService";
import { exportToCSV } from "@/app/src/utils/exportService";
import { generateReceiptPDF } from "@/app/src/utils/receiptService";
import { formatDate, useToday } from "@/app/src/utils/timeStore";
import { useRouter } from "next/navigation";

const PaymentTab = ({ unit }: { unit: any }) => {
    const today = useToday();

    // Data State
    const [payments, setPayments] = useState<any[]>([]);
    const [balance, setBalance] = useState<number>(0);
    const [charges, setCharges] = useState<any[]>([]);
    const [monthlyRent, setMonthlyRent] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState("");

    // UI State
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [processingRefund, setProcessingRefund] = useState(false);

    // Form State (Payment)
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentDate, setPaymentDate] = useState(today.toISOString().split('T')[0]);

    // Form State (Refund)
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundMethod, setRefundMethod] = useState("");

    // Filters
    const [filterMethod, setFilterMethod] = useState("");
    const [filterDate, setFilterDate] = useState("");

    const router = useRouter();

    const fetchPayments = async () => {
        if (!unit?.id) return;
        setLoading(true);
        try {
            const data = await apiService.get(`/api/units/${unit.id}/payments/`);
            setPayments(data.payments || []);
            setBalance(Number(data.balance || 0));
            setCharges(data.charges || []);
            setMonthlyRent(Number(data.monthly_rent || 0));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [unit?.id]);

    const summary = useMemo(() => {
        return {
            arrears: balance > 0 ? balance : 0,
            credit: balance < 0 ? Math.abs(balance) : 0,
            toClear: balance > 0 ? balance : 0, 
            balance,
            charges,
        };
    }, [balance]);

    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const matchesMethod = !filterMethod || p.payment_method === filterMethod;
            const matchesDate = !filterDate || p.paid_on.startsWith(filterDate);
            return matchesMethod && matchesDate;
        });
    }, [payments, filterMethod, filterDate]);

    const isValidMpesa = (ref: string) => /^[A-Z0-9]{10}$/.test(ref);

    const handleRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        
        const isMpesa = paymentMethod === "mpesa";
        if (isMpesa && !isValidMpesa(reference)) {
            setErrors({ reference: ["Enter a valid 10-digit M-Pesa code"] });
            return;
        }

        const payload = {
            amount_paid: Number(amount),
            payment_method: paymentMethod,
            reference,
            paid_on: paymentDate,
            type: 'payment',
            notes: notes,
        };

        try {
            const response = await apiService.post(`/api/units/${unit.id}/payments/`, payload);

            if (response.success){
                 // Reset & Collapse
                setAmount("");
                setPaymentMethod("");
                setReference("");
                setNotes("");
                setPaymentDate(today.toISOString().split('T')[0]);
                setIsFormExpanded(false);
                fetchPayments();
                setMessage(response.message);
            }
            
        } catch (error: any) {
            setErrors(error.response?.errors || { amount: ["Failed to record payment"] });
        }
    };

    const openRefund = () => {
        setRefundAmount(summary.credit);
        setRefundMethod("");
        setIsRefundModalOpen(true);
    };

    const handleRefund = async () => {
        if (refundAmount <= 0 || refundAmount > summary.credit) return;

        setProcessingRefund(true);
        try {
            const payload = {
                amount_paid: refundAmount,
                payment_method: refundMethod,
                reference: reference || `REFUND-${unit.name}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                notes: '',
                paid_on: today.toISOString().split('T')[0],
                type: 'refund',
            };

            await apiService.post(`/api/units/${unit.id}/payments/`, payload);
            setIsRefundModalOpen(false);
            fetchPayments();
            setMessage("Refund recorded successfully");
            setReference("");
        } catch (error: any) {
            setErrors(error.response?.data?.errors || {});
        } finally {
            setProcessingRefund(false);
        }
    };

    const handleExport = () => {
        const filename = `Statement_Unit_${unit.name}_${new Date().toISOString().split('T')[0]}`;
        exportToCSV(filteredPayments, filename);
    };

    if (unit.status !== "occupied") {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-gray-50">
                <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No active tenancy found.</p>
                <p className="text-xs text-gray-400">Assign a tenant first to manage payments.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-white border-2 border-blue-50 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black uppercase text-blue-600 leading-none">
                            {today.toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-gray-800 leading-none">
                            {today.getDate()}
                        </span>
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 leading-tight">
                            {today.toLocaleString('default', { month: 'long' })} {today.getFullYear()}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Current Billing Period
                        </p>
                    </div>
                </div>
                
                <div className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-bold text-gray-500 uppercase">
                    Active Session
                </div>
            </div>
            {/* NET POSITION HEADER */}
            <div className="flex items-center justify-between p-5 bg-gray-900 text-white rounded-2xl shadow-xl">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Account Balance</p>
                    <h2 className="text-2xl font-black">
                        {summary.balance === 0 ? "Settled" : 
                         summary.balance > 0 ? `KES ${summary.arrears.toLocaleString()} Arrears` : 
                         `KES ${summary.credit.toLocaleString()} Credit`}
                    </h2>
                </div>
                <div className={`p-3 rounded-full ${summary.balance > 0 ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                    {summary.balance > 0 ? <ArrowUpRight className="text-rose-400 w-8 h-8" /> : <ArrowDownLeft className="text-emerald-400 w-8 h-8" />}
                </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-gray-400">Monthly Rent</p>
                    <div className="text-xl font-black text-gray-800">KES {monthlyRent.toLocaleString()}</div>
                </div>

                <div className={`p-4 border rounded-2xl transition-all ${summary.arrears > 0 ? 'bg-rose-50 border-rose-100 shadow-inner' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                    <p className="text-[10px] font-bold uppercase text-rose-600">Arrears ({summary.charges})</p>
                    <div className="text-xl font-black text-rose-700">KES {summary.arrears.toLocaleString()}</div>
                </div>

                <div className={`p-4 border rounded-2xl transition-all ${summary.credit > 0 ? 'bg-emerald-50 border-emerald-100 shadow-inner' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold uppercase text-emerald-600">Credit</p>
                        {summary.credit > 0 && (
                            <button onClick={openRefund} className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] font-black hover:bg-emerald-700">
                                REFUND
                            </button>
                        )}
                    </div>
                    <div className="text-xl font-black text-emerald-700">KES {summary.credit.toLocaleString()}</div>
                </div>
            </div>

            {/* COLLAPSIBLE FORM */}
            <div className={`border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm ${message ? 'pb-4' : ''}`}>
                <button 
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isFormExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            <Receipt className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-700">Record New Payment</span>
                    </div>
                    {isFormExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <Plus className="w-5 h-5 text-blue-600" />}
                </button>

                {message && 
                    <div className="w-[calc(100%-32px)] mx-4 bg-green-100 p-2.5 rounded-xl flex items-center justify-between">
                        <p className="text-sm font-bold text-green-900">{message}</p>
                        <X onClick={() => setMessage('')} className="w-5 h-5 text-gray-400 cursor-pointer" />
                    </div>
                }

                {isFormExpanded && (
                    <form onSubmit={handleRecord} className="p-6 border-t border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Amount Paid <span className="text-base text-rose-500">*</span></label>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    className={`w-full p-2.5 bg-gray-50 border-2 rounded-xl outline-none focus:border-blue-500 transition-all ${errors.amount ? 'border-rose-500' : ''}`} 
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Method <span className="text-base text-rose-500">*</span></label>
                                <select 
                                    className="w-full p-2.5 bg-gray-50 border-2 rounded-xl outline-none focus:border-blue-500 text-sm transition-all" 
                                    value={paymentMethod} 
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option value="">Select Method</option>
                                    <option value="mpesa">M-Pesa</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>

                            {(paymentMethod === "mpesa" || paymentMethod === "bank") && (
                                <div className="md:col-span-2 space-y-1 animate-in zoom-in-95 duration-200">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex justify-between">
                                        <span>Reference Code <span className="text-base text-rose-500">*</span></span>
                                        {paymentMethod === "mpesa" && reference && (
                                            <span className={isValidMpesa(reference) ? 'text-emerald-600' : 'text-rose-500'}>
                                                {isValidMpesa(reference) ? 'Format Valid' : 'Format Invalid (10 Chars)'}
                                            </span>
                                        )}
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder={paymentMethod === 'mpesa' ? "e.g. RQB7TX890Z" : "Bank Ref Number"}
                                        maxLength={10}
                                        className={`w-full p-2.5 border-2 rounded-xl outline-none transition-all ${
                                            paymentMethod === 'mpesa' && reference 
                                            ? (isValidMpesa(reference) ? 'border-emerald-500 bg-emerald-50/20' : 'border-rose-500 bg-rose-50/20')
                                            : 'focus:border-blue-500'
                                        }`}
                                        value={reference}
                                        onChange={e => setReference(e.target.value.toUpperCase().trim())}
                                    />
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Payment Date</label>
                                <input type="date" className="w-full p-2.5 bg-gray-50 border-2 rounded-xl text-sm outline-none focus:border-blue-500 transition-all" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Payment Notes</label>
                                <textarea 
                                    rows={4}
                                    className="w-full p-2.5 bg-gray-50 border-2 rounded-xl text-sm outline-none focus:border-blue-500 transition-all" 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-sm transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
                            disabled={!amount || !paymentMethod || (paymentMethod === 'mpesa' && !isValidMpesa(reference))}
                        >
                            CONFIRM PAYMENT
                        </button>
                    </form>
                )}
            </div>

            {/* ACTION BAR: Export & Controls */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs uppercase tracking-widest text-gray-500">
                        Transaction Ledger
                    </h4>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                        {filteredPayments.length} Records
                    </span>
                </div>
                
                <button 
                    onClick={handleExport}
                    disabled={filteredPayments.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors text-[11px] font-black disabled:opacity-50"
                >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    EXPORT EXCEL
                </button>
            </div>

            {/* LEDGER */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <h4 className="font-black text-xs uppercase tracking-widest text-gray-500">Transaction History</h4>
                    <input 
                        type="date" 
                        className="p-1.5 border border-gray-200 rounded-lg text-[10px] outline-none focus:ring-2 ring-blue-500/10" 
                        value={filterDate} 
                        onChange={e => setFilterDate(e.target.value)} 
                    />
                </div>

                <div className="border border-gray-200 max-h-[400px] overflow-y-auto overflow-x-auto rounded-2xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-[10px] tracking-widest sticky top-0 font-black uppercase text-gray-400 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-left">Ref / Method</th>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredPayments.length > 0 ? filteredPayments.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-4 text-gray-600 font-medium">
                                        {new Date(p.paid_on).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="font-mono text-[10px] font-bold text-gray-400 uppercase">{p.reference || "No Ref"}</div>
                                        <div className="text-[10px] font-black uppercase text-gray-600">{p.payment_method}</div>
                                    </td>
                                    <td className="px-4 py-4 text-gray-600 text-[10px] font-medium w-[150px] max-w-[150px]">
                                        <details>
                                            <summary className="font-bold cursor-pointer">See Note</summary>
                                            <p>{p.notes || "No Note"}</p>
                                        </details>
                                    </td>
                                    <td className={`px-4 py-4 text-right font-black ${
                                        p.type === "refund" ? "text-orange-600" : "text-emerald-600"
                                    }`}>
                                        <div className="flex flex-col items-end">
                                            <span>
                                                {p.type === "refund" ? "− " : "+ "} KES {Number(p.amount_paid).toLocaleString()}
                                            </span>
                                            {p.type === "refund" && <span className="text-[8px] bg-orange-100 px-1 rounded">REFUND</span>}
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <button 
                                            onClick={() => generateReceiptPDF(p, unit, '')}
                                            className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <FileDown className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="px-4 py-12 text-center text-gray-400 italic text-xs">No transactions found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* QUICK TIP: Information for the user */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                    Financial reports are generated based on your current filters. 
                    To export a specific month, use the date filter before clicking Export.
                </p>
            </div>

            {/* REFUND MODAL */}
            {isRefundModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="text-center space-y-1">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <RefreshCcw className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Process Refund</h3>
                            <p className="text-xs text-gray-500">Returning credit balance to tenant</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase">Refund Amount <span className="text-base text-rose-500">*</span></label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-emerald-700 outline-none focus:ring-2 ring-emerald-500/20"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(Math.min(Number(e.target.value), summary.credit))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase">Return Via <span className="text-base text-rose-500">*</span></label>
                                <select 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                                    value={refundMethod}
                                    onChange={(e) => setRefundMethod(e.target.value)}
                                >
                                    <option value="">Select Method</option>
                                    <option value="mpesa">M-Pesa</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>
                            {(refundMethod === "mpesa" || refundMethod === "bank") && (
                                <div className="md:col-span-2 space-y-1 animate-in zoom-in-95 duration-200">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex justify-between">
                                        <span>Reference Code <span className="text-base text-rose-500">*</span></span>
                                        {refundMethod === "mpesa" && reference && (
                                            <span className={isValidMpesa(reference) ? 'text-emerald-600' : 'text-rose-500'}>
                                                {isValidMpesa(reference) ? 'Format Valid' : 'Format Invalid (10 Chars)'}
                                            </span>
                                        )}
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder={refundMethod === 'mpesa' ? "e.g. RQB7TX890Z" : "Bank Ref Number"}
                                        maxLength={10}
                                        className={`w-full p-2.5 border rounded-xl outline-none transition-all ${
                                            refundMethod === 'mpesa' && reference 
                                            ? (isValidMpesa(reference) ? 'border-emerald-500 bg-emerald-50/20' : 'border-rose-500 bg-rose-50/20')
                                            : 'border-gray-200 focus:border-blue-500'
                                        }`}
                                        value={reference}
                                        onChange={e => setReference(e.target.value.toUpperCase().trim())}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setIsRefundModalOpen(false)} className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                            <button 
                                onClick={handleRefund} 
                                disabled={processingRefund || !refundMethod || refundAmount <= 0 || !isValidMpesa(reference) && refundMethod === 'mpesa'}
                                className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {processingRefund ? "Processing..." : "Confirm Refund"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentTab;