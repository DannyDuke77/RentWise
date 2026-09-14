'use client';

import React, { useMemo, useState } from "react";
import {
    Receipt, Info, ArrowUpRight, ArrowDownLeft,
    TrendingUp, TrendingDown, CheckCircle2, Clock,
    LayoutGrid, UserRoundX, Shield, Plus,
    FileSpreadsheet, Wallet
} from "lucide-react";
import { generateReceiptPDF } from "@/app/src/utils/receiptService";
import { useToday } from "@/app/src/utils/timeStore";
import { Property, Payment, Unit } from "@/app/src/types/Types";
import { useUnitPayments } from "@/app/hooks/queries/useUnitDetailQueries";
import { useDebounce } from "@/app/hooks/useDebounce";
import { usePaymentMutation } from "@/app/hooks/mutations/usePaymentMutations";
import Pagination from "@/app/components/ui/Pagination";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { useToast } from "@/app/providers/ToastProvider";
import { PaymentModal, PaymentModalMode, PaymentFormPayload } from "@/app/components/modals/PaymentModal";
import { RefundModal } from "@/app/components/modals/RefundModal";
import StatCard from "@/app/components/ui/StatCard";
import { SearchInput } from '@/app/components/ui/SearchInput';
import RefreshButton from "../../ui/RefreshButton";
import PaymentActionsMenu from "../../payments/PaymentsActionsMenu";
import PaymentDeleteModal from "@/app/components/payments/PaymentDeleteModal";
import { usePaymentActions } from "@/app/hooks/usePaymentsActions";
import { useBusiness } from "@/app/providers/BusinessProvider";
import apiService from "@/app/services/apiService";

interface PaymentTabProps {
    property: Property;
    unit: Unit | null;
}

const PaymentTab = ({ property, unit }: PaymentTabProps) => {
    if (!unit) return null;

    const { activeBusinessId, activeBusiness } = useBusiness();
    const today = useToday();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const isOccupied = unit.status === 'occupied';

    const { showToast } = useToast();

    // --- Ledger filters ---
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filterMethod, setFilterMethod] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    // --- Single modal state (view / edit / create) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<PaymentModalMode>('view');
    const [modalPayment, setModalPayment] = useState<Payment | null>(null);
    const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

    // --- Create-mode controlled form state ---
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [paymentCategory, setPaymentCategory] = useState<"rent" | "deposit">("rent");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentDate, setPaymentDate] = useState(today.toISOString().split('T')[0]);
    const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState("");

    // --- Refund modal state ---
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundMethod, setRefundMethod] = useState("");
    const [refundCategory, setRefundCategory] = useState<"rent" | "deposit">("rent");
    const [refundReference, setRefundReference] = useState("");
    const [refundErrors, setRefundErrors] = useState<Record<string, string[]>>({});

    const {
        deletingPayment,
        isDeleteModalOpen,
        handleDeleteClick,
        handleConfirmDelete,
        closeModals,
        deletePaymentMutation,
        updatePaymentMutation,
    } = usePaymentActions();

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    const handleMethodChange = (value: string) => {
        setFilterMethod(value);
        setPage(1);
    };

    const handleDateChange = (value: string) => {
        setFilterDate(value);
        setPage(1);
    };

    const {
        data: paymentsData,
        refetch: refetchPayments,
        isFetching: isPaymentsFetching,
    } = useUnitPayments(
        unit.id,
        page,
        pageSize,
        isOccupied,
        debouncedSearch,
        filterMethod,
        filterDate
    );

    const paymentMutation = usePaymentMutation();

    const rawPayments: Payment[] = paymentsData?.payments ?? [];

    const totalCount = paymentsData?.count ?? 0;
    const balance = paymentsData?.balance ?? 0;
    const depositHeld = paymentsData?.depositHeld ?? 0;
    const charges = paymentsData?.charges ?? [];
    const monthlyRent = paymentsData?.monthlyRent ?? 0;

    const summary = useMemo(() => ({
        arrears: balance > 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
        toClear: balance > 0 ? balance : 0,
        balance,
        charges,
    }), [balance, charges]);

    const isValidMpesa = (ref: string) => /^[A-Z0-9]{10}$/.test(ref);
    const refundCap = refundCategory === "deposit" ? depositHeld : summary.credit;

    // ------------------------------------------------------------------
    // CREATE flow (controlled state, reset on success)
    // ------------------------------------------------------------------
    const handleCreateSubmit = async (payload: PaymentFormPayload) => {
        setCreateErrors({});

        if (payload.payment_method === "mpesa" && !isValidMpesa(payload.reference)) {
            setCreateErrors({ reference: ["Enter a valid 10-digit M-Pesa code"] });
            return;
        }

        const selectedDate = new Date(payload.paid_on);
        let targetMonth = selectedDate.getMonth() + 1;
        let targetYear = selectedDate.getFullYear();

        // If rent is fully settled and we're past the 25th, apply to next cycle
        if (payload.category === "rent" && summary.arrears <= 0 && selectedDate.getDate() > 25) {
            if (targetMonth === 12) {
                targetMonth = 1;
                targetYear += 1;
            } else {
                targetMonth += 1;
            }
        }

        const tenancyId = unit.tenancy_id;
        if (!tenancyId) {
            showToast("Error", "No active tenancy found. Please assign a tenant first.", "error");
            return;
        }

        try {
            const response = await paymentMutation.mutateAsync({
                unitId: unit.id,
                propertyId: property.id,
                payload: {
                    amount_paid: payload.amount_paid,
                    payment_method: payload.payment_method,
                    reference: payload.reference,
                    category: payload.category,
                    month: targetMonth,
                    year: targetYear,
                    paid_on: payload.paid_on,
                    type: 'payment',
                    notes: payload.notes,
                    tenancy_id: tenancyId,
                },
                targetMonth,
                targetYear,
            });

            if (response.success) {
                showToast("Payment Recorded!", `Payment of ${payload.amount_paid} recorded successfully`, "success");
                resetCreateForm();
                setIsPaymentModalOpen(false);
            } else {
                setCreateErrors(response);
                showToast("Payment Failed!", 'Please check the form for errors', "error");
            }
        } catch (error: any) {
            console.error(error);
            setCreateErrors(error.response?.data || error.response || {});
        }
    };

    const resetCreateForm = () => {
        setAmount("");
        setPaymentCategory("rent");
        setPaymentMethod("");
        setReference("");
        setNotes("");
        setPaymentDate(today.toISOString().split("T")[0]);
        setMessage("");
        setCreateErrors({});
    };

    const openCreateModal = () => {
        resetCreateForm();
        setIsPaymentModalOpen(true);
    };

    // ------------------------------------------------------------------
    // VIEW / EDIT flow (modal owns form state; parent only submits payload)
    // ------------------------------------------------------------------
    const openView = (payment: Payment) => {
        setModalPayment(payment);
        setModalMode('view');
        setEditErrors({});
        setIsModalOpen(true);
    };

    const openEdit = (payment: Payment) => {
        setModalPayment(payment);
        setModalMode('edit');
        setEditErrors({});
        setIsModalOpen(true);
    };

    const closePaymentModal = () => {
        setIsModalOpen(false);
        setModalPayment(null);
        setEditErrors({});
    };

    const handleEnableEdit = () => {
        setModalMode('edit');
    };

    const handleUpdateSubmit = async (payload: PaymentFormPayload) => {
        if (!modalPayment) return;

        try {
            const response = await updatePaymentMutation.mutateAsync({
                paymentId: modalPayment.id,
                unitId: unit.id,
                propertyId: property.id,
                payload,
                targetMonth: new Date(modalPayment.paid_on).getMonth() + 1,
                targetYear: new Date(modalPayment.paid_on).getFullYear(),
            });

            if (response.success || response.id) {
                showToast('Payment Updated', 'Payment updated successfully', 'success');
                closePaymentModal();
            } else {
                setEditErrors(response.errors || response);
            }
        } catch (error: any) {
            console.error('Error updating payment:', error);
            setEditErrors(error.response?.data || { general: ['Failed to update payment'] });
        }
    };

    // ------------------------------------------------------------------
    // REFUND flow
    // ------------------------------------------------------------------
    const openRefund = (category: "rent" | "deposit") => {
        setRefundCategory(category);
        setRefundAmount(category === "deposit" ? depositHeld : summary.credit);
        setRefundMethod("");
        setRefundReference("");
        setRefundErrors({});
        setIsRefundModalOpen(true);
    };

    const handleRefund = async () => {
        setRefundErrors({});

        if (refundAmount <= 0 || refundAmount > refundCap) {
            setRefundErrors({ amount_paid: ["Refund amount must be greater than zero and less than or equal to the available balance"] });
            return;
        }

        if (!refundMethod) {
            setRefundErrors({ payment_method: ["Select a payment method"] });
            return;
        }

        if (refundMethod === "mpesa" && !isValidMpesa(refundReference)) {
            setRefundErrors({ reference: ["Enter a valid 10-digit M-Pesa code"] });
            return;
        }

        const tenancyId = unit.tenancy_id;
        if (!tenancyId) {
            showToast("Error", "No active tenancy found.", "error");
            return;
        }

        const transactionReference = refundReference || `REFUND-${unit.name}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const selectedDate = new Date();
        const targetMonth = selectedDate.getMonth() + 1;
        const targetYear = selectedDate.getFullYear();

        try {
            const response = await paymentMutation.mutateAsync({
                unitId: unit.id,
                propertyId: property.id,
                payload: {
                    amount_paid: refundAmount,
                    payment_method: refundMethod,
                    reference: transactionReference,
                    category: refundCategory,
                    month: targetMonth,
                    year: targetYear,
                    paid_on: today.toISOString().split('T')[0],
                    type: 'refund',
                    notes: '',
                    tenancy_id: tenancyId,
                },
                targetMonth,
                targetYear,
            });

            if (response.success) {
                showToast("Refund Recorded!", `Refund of ${refundAmount} recorded successfully`, "success");
                setIsRefundModalOpen(false);
                setRefundReference("");
            } else {
                setRefundErrors(response);
                showToast("Refund Failed!", 'Please check the form for errors', "error");
            }
        } catch (error: any) {
            console.error(error);
            setRefundErrors(error.response?.data || error.response || {});
        }
    };

    // ------------------------------------------------------------------
    // Export / receipt helpers
    // ------------------------------------------------------------------
    const handleExportCSV = async () => {
        if (!activeBusiness?.id) {
            showToast("Error", "No business selected", "error");
            return;
        }

        const params = new URLSearchParams({ export_format: "csv" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (filterMethod) params.set("payment_method", filterMethod);
        if (filterDate) params.set("filter_date", filterDate);

        try {
            const blob = await apiService.getBlob(
                `/api/payments/export/?${params.toString()}`,
                { businessId: activeBusinessId }
            );

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            showToast("Success", "Export downloaded", "success");
        } catch (error) {
            console.error(error);
            showToast("Error", "Export failed", "error");
        }
    };

    const handleGenerateReceipt = async (payment: Payment) => {
        if (!activeBusiness) {
            showToast("Error", "No business profile loaded", "error");
            return;
        }

        try {
            const ok = await generateReceiptPDF(payment, payment.property, payment.unit, activeBusiness);
            if (ok) {
                showToast("Success", "Receipt downloaded", "success");
            } else {
                showToast("Error", "Failed to generate receipt", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Error", "Failed to generate receipt", "error");
        }
    };

    const clearFilters = () => {
        setFilterMethod("");
        setFilterDate("");
        setSearchTerm("");
    };

    // ------------------------------------------------------------------
    // Render guards
    // ------------------------------------------------------------------
    if (unit.status !== "occupied") {
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
        <div className="space-y-8 md:px-2 py-4">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                            <Wallet className="w-6 h-6 text-white" />
                        </span>
                        Payment Management
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <RefreshButton isFetching={isPaymentsFetching} refetch={refetchPayments} />
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
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
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
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
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

            {/* Quick Actions */}
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
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-sm shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Record Payment
                        </button>

                        <button
                            onClick={handleExportCSV}
                            disabled={rawPayments.length === 0}
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
                            {rawPayments.length} records
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <SearchInput onSearchChange={handleSearchChange} />

                        <select
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={filterMethod}
                            onChange={e => handleMethodChange(e.target.value)}
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
                            onChange={e => handleDateChange(e.target.value)}
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
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paid On</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recorded On</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reference</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isPaymentsFetching ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <LoadingSpinner size="lg" label="Loading payments data..." />
                                        </td>
                                    </tr>
                                ) : rawPayments.length > 0 ? rawPayments.map((payment: Payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-300/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-700">
                                                {new Date(payment.paid_on).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {new Date(payment.paid_on).toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-700">
                                                {new Date(payment.created_at).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {new Date(payment.created_at).toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })}
                                            </p>
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
                                            <div className="flex items-center justify-center gap-2">
                                                <PaymentActionsMenu
                                                    payment={payment}
                                                    onGenerateReceipt={handleGenerateReceipt}
                                                    onView={openView}
                                                    onEdit={openEdit}
                                                    onDelete={handleDeleteClick}
                                                    showEdit={payment.source !== "stk"}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
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

                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
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

            {/* CREATE modal (controlled state) */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    resetCreateForm();
                }}
                onSubmit={handleCreateSubmit}
                mode="create"
                isPending={paymentMutation.isPending}
                errors={createErrors}
                isValidMpesa={isValidMpesa}
                paymentCategory={paymentCategory}
                setPaymentCategory={setPaymentCategory}
                amount={amount}
                setAmount={setAmount}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                reference={reference}
                setReference={setReference}
                paymentDate={paymentDate}
                setPaymentDate={setPaymentDate}
                notes={notes}
                setNotes={setNotes}
                message={message}
                setMessage={setMessage}
            />

            {/* VIEW / EDIT modal (self-managed state) */}
            <PaymentModal
                isOpen={isModalOpen}
                onClose={closePaymentModal}
                onSubmit={handleUpdateSubmit}
                mode={modalMode}
                isPending={updatePaymentMutation.isPending}
                errors={editErrors}
                isValidMpesa={isValidMpesa}
                payment={modalPayment}
                onEnableEdit={handleEnableEdit}
            />

            {/* Delete modal */}
            <PaymentDeleteModal
                isOpen={isDeleteModalOpen}
                payment={deletingPayment}
                isPending={deletePaymentMutation.isPending}
                onConfirm={handleConfirmDelete}
                onClose={closeModals}
            />

            {/* Refund modal */}
            <RefundModal
                isOpen={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                onConfirm={handleRefund}
                isPending={paymentMutation.isPending}
                errors={refundErrors}
                setErrors={setRefundErrors}
                refundCategory={refundCategory}
                refundAmount={refundAmount}
                setRefundAmount={setRefundAmount}
                refundMethod={refundMethod}
                setRefundMethod={setRefundMethod}
                refundReference={refundReference}
                setRefundReference={setRefundReference}
                refundCap={refundCap}
                isValidMpesa={isValidMpesa}
            />
        </div>
    );
};

export default PaymentTab;