'use client';

import React, { useMemo, useState, useEffect } from "react";
import {
    Receipt, Info, ArrowUpRight, ArrowDownLeft,
    RefreshCcw, Plus,
    FileSpreadsheet, FileDown,
    AlertCircle, X, Wallet, TrendingUp, 
    TrendingDown, CreditCard, Building2, 
    Calendar, CheckCircle2, Clock,
    Search, LayoutGrid,
    UserRoundX
} from "lucide-react";
import { exportToCSV } from "@/app/src/utils/exportService";
import { generateReceiptPDF } from "@/app/src/utils/receiptService";
import { useToday } from "@/app/src/utils/timeStore";
import { Property, Payment, Unit } from "@/app/src/types/Types";
import { useUnitPayments } from "@/app/hooks/queries/useUnitDetailQueries";
import { useBusinessProfile } from "@/app/hooks/queries/useSettingsQueries";
import { useRecordPayment, useRecordRefund } from "@/app/hooks/mutations/usePaymentMutations";
import Pagination from "@/app/components/ui/Pagination";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

interface PaymentTabProps {
    property: Property;
    unit: Unit | null;
}

const PaymentTab = ({ property, unit }: PaymentTabProps) => {
    const today = useToday();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const isOccupied = unit?.status === 'occupied';

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);


    const [filterMethod, setFilterMethod] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const { 
        data: paymentsData,
        refetch: refetchPayments,
        isFetching: isPaymentsFetching, 
    } = useUnitPayments(page, pageSize, unit?.id, isOccupied);
    const { data: profile } = useBusinessProfile(isOccupied);

    const rawPayments: Payment[] = paymentsData?.payments ?? [];

    const totalCount = paymentsData?.count ?? 0;
    const balance = paymentsData?.balance ?? 0;
    const depositHeld = paymentsData?.depositHeld ?? 0;
    const charges = paymentsData?.charges ?? [];
    const monthlyRent = paymentsData?.monthlyRent ?? 0;

    const recordPayment = useRecordPayment(unit?.id);
    const recordRefund = useRecordRefund(unit?.id);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState("");

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    const [amount, setAmount] = useState("");
    const [paymentCategory, setPaymentCategory] = useState<"rent" | "deposit">("rent");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentDate, setPaymentDate] = useState(today.toISOString().split('T')[0]);

    const [refundAmount, setRefundAmount] = useState(0);
    const [refundMethod, setRefundMethod] = useState("");
    const [refundCategory, setRefundCategory] = useState<"rent" | "deposit">("rent");
    const [refundReference, setRefundReference] = useState("");

    const summary = useMemo(() => {
        return {
            arrears: balance > 0 ? balance : 0,
            credit: balance < 0 ? Math.abs(balance) : 0,
            toClear: balance > 0 ? balance : 0,
            balance,
            charges,
        };
    }, [balance, charges]);

    const filteredPayments = rawPayments.filter((payment: Payment) => {
            const matchesMethod = !filterMethod || payment.payment_method === filterMethod;
            const matchesDate = !filterDate || payment.paid_on.startsWith(filterDate);
            const matchesSearch = !searchTerm || 
                payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesMethod && matchesDate && matchesSearch;
    }, [rawPayments, filterMethod, filterDate, searchTerm]);

    const isValidMpesa = (ref: string) => /^[A-Z0-9]{10}$/.test(ref);

    const handleRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const isMpesa = paymentMethod === "mpesa";
        if (isMpesa && !isValidMpesa(reference)) {
            setErrors({ reference: ["Enter a valid 10-digit M-Pesa code"] });
            return;
        }

        const selectedDate = new Date(paymentDate);
        let targetMonth = selectedDate.getMonth() + 1;
        let targetYear = selectedDate.getFullYear();

        if (paymentCategory === "rent" && summary.arrears <= 0 && selectedDate.getDate() > 25) {
            if (targetMonth === 12) {
                targetMonth = 1;
                targetYear += 1;
            } else {
                targetMonth += 1;
            }
        }

        const payload = {
            amount_paid: Number(amount),
            payment_method: paymentMethod,
            reference,
            category: paymentCategory,
            month: targetMonth,
            year: targetYear,
            paid_on: paymentDate,
            type: 'payment',
            notes: notes,
            ...(property?.id && { property: property.id }),
        };

        try {
            const response = await recordPayment.mutateAsync({
                propertyId: property.id, 
                today: today,
                payload: payload
            });

            if (response.success) {
                setAmount("");
                setPaymentCategory("rent");
                setPaymentMethod("");
                setReference("");
                setNotes("");
                setPaymentDate(today.toISOString().split('T')[0]);
                setMessage(response.message);
                setTimeout(() => setMessage(""), 5000);
                setIsPaymentModalOpen(false);
            } else {
                setErrors(
                    typeof response.amount_paid === 'string'
                        ? { amount_paid: [response.amount_paid] }
                        : response.errors || { amount_paid: response.amount_paid || ["Failed to record payment"] }
                );
            }
        } catch (error: any) {
            console.error(error);
            const backendErrors = error.response?.data?.errors || error.response?.data || {};

            setErrors({
                ...backendErrors,
                amount_paid: Array.isArray(backendErrors.amount_paid)
                    ? backendErrors.amount_paid
                    : [backendErrors.amount_paid || "Failed to record payment"]
            });
        }
    };

    const refundCap = refundCategory === "deposit" ? depositHeld : summary.credit;

    const openRefund = (category: "rent" | "deposit") => {
        setRefundCategory(category);
        setRefundAmount(category === "deposit" ? depositHeld : summary.credit);
        setRefundMethod("");
        setRefundReference("");
        setIsRefundModalOpen(true);
    };

    const handleRefund = async () => {
        if (refundAmount <= 0 || refundAmount > refundCap) {
            setErrors({ amount_paid: ["Refund amount exceeds available balance"] });
            return;
        }

        const isMpesa = refundMethod === "mpesa";
        if (isMpesa && !isValidMpesa(refundReference)) {
            setErrors({ reference: ["Enter a valid 10-digit M-Pesa code"] });
            return;
        }

        try {
            const payload = {
                amount_paid: refundAmount,
                payment_method: refundMethod,
                category: refundCategory,
                reference: refundReference || `REFUND-${unit?.name}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                notes: '',
                paid_on: today.toISOString().split('T')[0],
                type: 'refund',
                ...(property?.id && { property: property.id }),
            };

            await recordRefund.mutateAsync({
                propertyId: property.id,
                today: today,
                payload: payload
            });
            setIsRefundModalOpen(false);
            setMessage("Refund recorded successfully");
            setTimeout(() => setMessage(""), 5000);
            setRefundReference("");
        } catch (error: any) {
            setErrors(error.response?.data?.errors || {});
        }
    };

    const handleExport = () => {
        const filename = `Statement_Unit_${unit?.name}_${new Date().toISOString().split('T')[0]}`;
        exportToCSV(filteredPayments, filename);
    };

    const clearFilters = () => {
        setFilterMethod("");
        setFilterDate("");
        setSearchTerm("");
    };

    if (unit?.status !== "occupied") {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-200 rounded-3xl flex items-center justify-center mb-6 shadow-xl offset-4">
                    <UserRoundX className="w-12 h-12 text-red-600 animate-bounce" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No Active Tenancy</h3>
                <p className="text-gray-400">Assign a tenant first to manage payments and track transactions</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 px-2 py-4">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                            <Wallet className="w-6 h-6 text-white" />
                        </span>
                        Payment Management
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetchPayments()}
                        disabled={isPaymentsFetching}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isPaymentsFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live</span>
                    </div>
                </div>
            </div>

            {/* Billing Notice */}
            {summary.arrears <= 0 && today.getDate() > 25 && (
                <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm">
                    <div className="p-2.5 bg-amber-100 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-800">Next Billing Cycle</h4>
                        <p className="text-sm text-amber-700/80">
                            Rent payments made now will apply to <strong>{nextMonth.toLocaleString('default', { month: 'long' })}</strong> billing cycle
                        </p>
                    </div>
                </div>
            )}

            {/* Balance Overview */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Account Balance</p>
                        <div className="flex items-center gap-4 mt-2">
                            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                                {summary.balance === 0 ? "Settled" :
                                 summary.balance > 0 ? `KES ${summary.arrears.toLocaleString()}` :
                                 `KES ${summary.credit.toLocaleString()}`}
                            </h2>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                                summary.balance > 0 ? 'bg-rose-500/20 text-rose-400' :
                                summary.balance < 0 ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-gray-500/20 text-gray-400'
                            }`}>
                                {summary.balance > 0 ? 'In Arrears' :
                                 summary.balance < 0 ? 'In Credit' : 'Settled'}
                            </div>
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Monthly Rent:</span>
                                <span className="text-white font-bold text-lg">KES {monthlyRent.toLocaleString()}</span>
                            </div>
                            {summary.charges > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Charges:</span>
                                    <span className="text-rose-400 font-bold text-lg">KES {summary.charges.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 self-start lg:self-center">
                        <div className={`p-4 rounded-2xl ${
                            summary.balance > 0 ? 'bg-rose-500/20' : 
                            summary.balance < 0 ? 'bg-emerald-500/20' : 
                            'bg-gray-500/20'
                        }`}>
                            {summary.balance > 0 ? (
                                <TrendingUp className="w-10 h-10 text-rose-400" strokeWidth={1.5} />
                            ) : summary.balance < 0 ? (
                                <TrendingDown className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                            ) : (
                                <CheckCircle2 className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Monthly Rent"
                    value={`KES ${monthlyRent.toLocaleString()}`}
                    icon={<Receipt className="w-5 h-5" />}
                    color="blue"
                />
                <StatCard
                    label="Arrears"
                    value={`KES ${summary.arrears.toLocaleString()}`}
                    icon={<ArrowUpRight className="w-5 h-5" />}
                    color="rose"
                    subtitle={summary.charges > 0 ? `Includes charges: KES ${summary.charges.toLocaleString()}` : undefined}
                />
                <StatCard
                    label="Credit Balance"
                    value={`KES ${summary.credit.toLocaleString()}`}
                    icon={<ArrowDownLeft className="w-5 h-5" />}
                    color="emerald"
                    action={summary.credit > 0 ? {
                        label: 'Process Refund',
                        onClick: () => openRefund("rent")
                    } : undefined}
                />
                <StatCard
                    label="Deposit Held"
                    value={`KES ${depositHeld.toLocaleString()}`}
                    icon={<Shield className="w-5 h-5" />}
                    color="purple"
                    action={depositHeld > 0 ? {
                        label: 'Process Refund',
                        onClick: () => openRefund("deposit")
                    } : undefined}
                />
            </div>

            {/* Quick Actions - Horizontal Bar */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <LayoutGrid className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Quick Actions</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-sm shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Record Payment
                        </button>
                    
                        <button
                            onClick={handleExport}
                            disabled={filteredPayments.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-sm border-2 border-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Export Ledger CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-gray-800">Transaction Ledger</h4>
                        <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold">
                            {filteredPayments.length} records
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-72"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <select
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={filterMethod}
                            onChange={e => setFilterMethod(e.target.value)}
                        >
                            <option value="">All Methods</option>
                            <option value="mpesa">M-Pesa</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cash">Cash</option>
                        </select>
                        
                        <input
                            type="date"
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                        
                        {(filterMethod || filterDate || searchTerm) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0 z-10 border-b-4 border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reference</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isPaymentsFetching ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex justify-center items-center">
                                                <LoadingSpinner 
                                                    size="lg"
                                                    label="Loading payments data..."
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPayments.length > 0 && !isPaymentsFetching ? filteredPayments.map((payment: Payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-300/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-700">
                                                {new Date(payment.paid_on).toLocaleDateString('en-GB', { 
                                                    day: '2-digit', 
                                                    month: 'short', 
                                                    year: 'numeric' 
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-sm font-bold text-gray-700 uppercase">
                                                {payment.reference || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-gray-500 capitalize">{payment.payment_method}</span>
                                                {payment.category === 'deposit' && (
                                                    <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-bold uppercase">Deposit</span>
                                                )}
                                                {payment.type === 'refund' && (
                                                    <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded font-bold uppercase">Refund</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 max-w-xs truncate">
                                                {payment.notes || <span className="text-gray-400 italic">No notes</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className={`text-lg font-bold ${
                                                payment.type === "refund" ? "text-rose-600" : "text-emerald-600"
                                            }`}>
                                                {payment.type === "refund" ? "−" : "+"} KES {Number(payment.amount_paid).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => generateReceiptPDF(payment, property, unit, profile)}
                                                className="p-2.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:shadow"
                                                title="Download Receipt"
                                            >
                                                <FileDown className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-5 bg-gray-100 rounded-2xl">
                                                    <Receipt className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
                                                </div>
                                                <p className="text-gray-500 font-medium text-lg">No transactions found</p>
                                                <p className="text-sm text-gray-400">Record a payment to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        onPageChange={(page) => setPage(page)}
                        onPageSizeChange={(pageSize) => setPageSize(pageSize)}
                    />
                </div>
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-800">Financial Reports</p>
                        <p className="text-sm text-blue-600/70">Use filters above to generate reports for specific periods</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Shield className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Secure Transactions</p>
                        <p className="text-sm text-gray-500">All payments are recorded securely with timestamp verification</p>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in scale-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                                    <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Record Payment</h3>
                                    <p className="text-sm text-gray-500">Add a new transaction to the ledger</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {message && (
                            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <p className="text-sm font-medium text-emerald-800">{message}</p>
                                </div>
                                <button onClick={() => setMessage('')} className="p-1 hover:bg-emerald-100 rounded-lg transition-colors">
                                    <X className="w-4 h-4 text-emerald-600" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleRecord} className="space-y-5">
                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600">Payment Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentCategory("rent")}
                                        className={`flex items-center justify-center gap-2 p-3.5 rounded-lg text-sm font-bold border-2 transition-all ${
                                            paymentCategory === "rent"
                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Rent / Charges
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentCategory("deposit")}
                                        className={`flex items-center justify-center gap-2 p-3.5 rounded-lg text-sm font-bold border-2 transition-all ${
                                            paymentCategory === "deposit"
                                                ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/30"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        Security Deposit
                                    </button>
                                </div>
                                {paymentCategory === "deposit" && (
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
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">KES</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className={`w-full pl-16 pr-4 py-3 bg-gray-50 border-2 rounded-xl outline-none transition-all text-gray-800 font-bold ${
                                                errors.amount_paid 
                                                    ? 'border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-200' 
                                                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                                            }`}
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
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
                                    <select
                                        className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
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
                                    <div className="md:col-span-2 space-y-1.5 animate-in fade-in duration-200">
                                        <label className="text-sm font-bold text-gray-600 flex justify-between">
                                            <span>Reference Code <span className="text-rose-500">*</span></span>
                                            {paymentMethod === "mpesa" && reference && (
                                                <span className={isValidMpesa(reference) ? 'text-emerald-600' : 'text-rose-500'}>
                                                    {isValidMpesa(reference) ? '✓ Valid' : '✗ Invalid (10 chars)'}
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={paymentMethod === 'mpesa' ? "e.g. RQB7TX890Z" : "Bank Reference"}
                                            maxLength={10}
                                            className={`w-full p-3 border-2 rounded-xl outline-none transition-all text-sm font-mono uppercase ${
                                                paymentMethod === 'mpesa' && reference
                                                    ? isValidMpesa(reference) 
                                                        ? 'border-emerald-400 bg-emerald-50/30 focus:ring-4 focus:ring-emerald-200' 
                                                        : 'border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-200'
                                                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                                            }`}
                                            value={reference}
                                            onChange={e => setReference(e.target.value.toUpperCase().trim())}
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
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
                                            value={paymentDate}
                                            onChange={e => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-600">Notes</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Optional notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="flex-1 py-3.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!amount || !paymentMethod || (paymentMethod === 'mpesa' && !isValidMpesa(reference)) || recordPayment.isPending}
                                    className="flex-1 py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {recordPayment.isPending ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        `Confirm ${paymentCategory === 'deposit' ? 'Deposit' : 'Payment'}`
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {isRefundModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in scale-95 duration-200">
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
                                {refundCategory === "deposit" ? "Refund Security Deposit" : "Process Refund"}
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

                        <div className="space-y-5 mt-6">
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
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-600 block mb-1.5">
                                    Refund Method <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    className="w-full p-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
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
                                <div className="space-y-1.5 animate-in fade-in duration-200">
                                    <label className="text-sm font-bold text-gray-600 flex justify-between">
                                        <span>Reference <span className="text-rose-500">*</span></span>
                                        {refundMethod === "mpesa" && refundReference && (
                                            <span className={isValidMpesa(refundReference) ? 'text-emerald-600' : 'text-rose-500'}>
                                                {isValidMpesa(refundReference) ? '✓ Valid' : '✗ Invalid'}
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={refundMethod === 'mpesa' ? "e.g. RQB7TX890Z" : "Bank Reference"}
                                        maxLength={10}
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
                                    {errors.reference && (
                                        <p className="text-sm font-semibold text-rose-500 flex items-center gap-1.5">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.reference[0]}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsRefundModalOpen(false)}
                                className="flex-1 py-3.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRefund}
                                disabled={recordRefund.isPending || !refundMethod || refundAmount <= 0 || refundAmount > refundCap || (refundMethod === 'mpesa' && !isValidMpesa(refundReference))}
                                className={`flex-1 py-3.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    refundCategory === "deposit" 
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-600/30' 
                                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/30'
                                }`}
                            >
                                {recordRefund.isPending ? (
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
                </div>
            )}
        </div>
    );
};

// StatCard Component
interface StatCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: 'blue' | 'rose' | 'emerald' | 'purple';
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const StatCard = ({ label, value, icon, color, subtitle, action }: StatCardProps) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-100', hover: 'hover:border-blue-200' },
        rose: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', iconBg: 'bg-rose-100', hover: 'hover:border-rose-200' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-100', hover: 'hover:border-emerald-200' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', iconBg: 'bg-purple-100', hover: 'hover:border-purple-200' },
    };

    const colors = colorClasses[color];

    return (
        <div className={`p-5 rounded-lg border ${colors.bg} ${colors.border} ${colors.hover} transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                    <div className={colors.text}>{icon}</div>
                </div>
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className={`mt-3 text-sm font-bold ${colors.text} hover:opacity-80 transition-opacity flex items-center gap-1`}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

// Shield Icon
const Shield = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L3 7v5c0 5.5 4 9.5 9 12 5-2.5 9-6.5 9-12V7l-9-4z" />
    </svg>
);

export default PaymentTab;