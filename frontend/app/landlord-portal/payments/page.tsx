"use client";

import { useState } from "react";
import { 
    Calendar, DollarSign, Home, HandCoins, CardSim, Landmark, 
    CircleDollarSign, ArrowRightCircle,
    FileSpreadsheet
} from "lucide-react";
import { usePayments } from "@/app/hooks/queries/usePaymentsQueries";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import PaymentAnalytics from "@/app/components/payments/PaymentAnalytics";
import { generateReceiptPDF } from "@/app/src/utils/receiptService";
import { useToast } from "@/app/providers/ToastProvider";
import Pagination from "@/app/components/ui/Pagination";
import { Payment } from "@/app/src/types/Types";
import Link from "next/link";
import { useDebounce } from "@/app/hooks/useDebounce";
import { SearchInput } from '@/app/components/ui/SearchInput';
import { useFilterWithPagination } from "@/app/hooks/useFilterWithPagination";
import { PaymentFormPayload, PaymentModal, PaymentModalMode } from "@/app/components/modals/PaymentModal";
import PaymentActionsMenu from "@/app/components/payments/PaymentsActionsMenu";
import PaymentDeleteModal from "@/app/components/payments/PaymentDeleteModal";
import { usePaymentActions } from "@/app/hooks/usePaymentsActions";
import { useBusiness } from "@/app/providers/BusinessProvider";
import apiService from "@/app/services/apiService";
import PaymentsPageSkeleton from "@/app/components/skeletons/PaymentsPageSkeleton";

const PaymentsPage = () => {
    const {
        page,
        setPage,
        searchTerm,
        setSearchTerm,
        paymentMethod,
        setPaymentMethod,
        filterDate,
        setFilterDate,
        filterType,
        setFilterType,
        clearFilters
    } = useFilterWithPagination();

    const [pageSize, setPageSize] = useState(10);
    const { showToast } = useToast();
    const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
    const { activeBusinessId, activeBusiness } = useBusiness();

    // Modal state — single modal handles view/edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<PaymentModalMode>('view');
    const [modalPayment, setModalPayment] = useState<Payment | null>(null);
    const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

    const {
        deletingPayment,
        isDeleteModalOpen,
        handleDeleteClick,
        handleConfirmDelete,
        closeModals,
        deletePaymentMutation,
        updatePaymentMutation
    } = usePaymentActions();

    const debouncedSearch = useDebounce(searchTerm);
    const effectiveSearch = debouncedSearch.trim();

    const { data: paymentData, isPending: paymentsLoading } = usePayments(
        page, 
        pageSize, 
        effectiveSearch, 
        paymentMethod, 
        filterDate, 
        filterType
    );

    const rawPayments: Payment[] = paymentData?.results ?? [];
    const count = paymentData?.count ?? 0;

    const getPaymentMethodIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'bank': return <Landmark className="w-5 h-5" />;
            case 'cash': return <HandCoins className="w-5 h-5" />;
            case 'mpesa': return <CardSim className="w-5 h-5" />;
            default: return <DollarSign className="w-5 h-5" />;
        }
    };

    const getPaymentTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'payment': return "bg-green-100 text-green-800";
            case 'refund': return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'rent': return "bg-blue-100 text-blue-800";
            case 'deposit': return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const isValidMpesa = (ref: string) => /^[A-Z0-9]{10}$/.test(ref);

    const handleExportCSV = async () => {
        if (!activeBusiness?.id) {
            showToast("Error", "No business selected", "error");
            return;
        }

        const params = new URLSearchParams({ export_format: "csv" });
        if (effectiveSearch) params.set("search", effectiveSearch);
        if (paymentMethod) params.set("payment_method", paymentMethod);
        if (filterType) params.set("filter_type", filterType);
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

        setIsLoadingReceipt(true);

        try {
            const ok = await generateReceiptPDF(payment, payment.property, payment.unit, activeBusiness);

            if (ok) {
                showToast("Success", "Receipt downloaded", "success");
            } else {
                showToast("Error", "Failed to generate receipt", "error");
            }
        } finally {
            setIsLoadingReceipt(false);
        }
    };

    // --- Modal handlers ---
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

    const closeModal = () => {
        setIsModalOpen(false);
        setModalPayment(null);
        setEditErrors({});
    };

    const handleEnableEdit = () => {
        // Called when the user checks "Enable editing" inside the view modal.
        setModalMode('edit');
    };

    const handleUpdateSubmit = async (payload: PaymentFormPayload) => {
    if (!modalPayment) return;

    try {
        const response = await updatePaymentMutation.mutateAsync({
            paymentId: modalPayment.id,
            unitId: modalPayment.unit.id,
            propertyId: modalPayment.property.id,
            payload,
            targetMonth: new Date(modalPayment.paid_on).getMonth() + 1,
            targetYear: new Date(modalPayment.paid_on).getFullYear(),
        });

        if (response.success || response.id) {
            showToast('Payment Updated', 'Payment updated successfully', 'success');
            closeModal();
        } else {
            setEditErrors(response.errors || response);
        }
    } catch (error: any) {
        console.error('Error updating payment:', error);
        setEditErrors(error.response?.data || { general: ['Failed to update payment'] });
    }
};

    if (paymentsLoading) {
        return <PaymentsPageSkeleton />;
    }

    return (
        <div className="max-w-8xl space-y-8 mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="flex items-center space-x-3">
                                <CircleDollarSign className="w-10 h-10" />
                                <span className="text-3xl font-bold text-gray-900 uppercase">Payments</span>
                            </h1>
                            <p className="text-gray-600 mt-2">Track and manage all payment transactions</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-white rounded-lg shadow-sm px-4 py-2">
                                <span className="text-sm text-gray-600">Total Records:</span>
                                <span className="ml-2 font-semibold text-gray-900">{count}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Stats */}
                <PaymentAnalytics label={`${activeBusiness?.company_name} Payments Analytics`} />

                {/* Table Container */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 lg:flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Payments</h2>
                            <p className="text-sm text-gray-600 mt-1">Showing {rawPayments.length} of {count} payments</p>
                        </div>

                        <div className="lg:flex lg:flex-wrap items-center mt-6 lg:mt-0 gap-4 space-y-4 lg:space-y-0">
                            <SearchInput onSearchChange={(value) => {
                                setSearchTerm(value);
                            }} />
                            
                            <select
                                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                value={paymentMethod}
                                onChange={e => {
                                    setPaymentMethod(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All Methods</option>
                                <option value="mpesa">M-Pesa</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="cash">Cash</option>
                            </select>

                            <select
                                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                value={filterType}
                                onChange={e => {
                                    setFilterType(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All Types</option>
                                <option value="payment">Payment</option>
                                <option value="refund">Refund</option>
                            </select>

                            <input
                                type="date"
                                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                value={filterDate}
                                title="Filter by Payment Date"
                                onChange={(e) => {
                                    setFilterDate(e.target.value);
                                    setPage(1);
                                }}
                            />

                            {(paymentMethod || filterDate || searchTerm || filterType) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2.5 text-sm font-medium text-rose-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Clear
                                </button>
                            )}
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

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <Home className="w-4 h-4 mr-2" />
                                            Property
                                        </div>
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Tenancy Start
                                        </div>
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount (KES)</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid On</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
                                    <th className="text-left py-4 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rawPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-gray-500">
                                            No payments found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    rawPayments.map((payment: Payment) => (
                                        <tr key={payment.id} className="hover:bg-blue-50/30 transition-all duration-200 hover:shadow-sm">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                                                        <Home className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-400 whitespace-nowrap">{payment.property.name}</p>
                                                        <p className="font-medium text-gray-900">{payment.unit.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="text-gray-700 whitespace-nowrap">
                                                        {new Date(payment.tenancy_start).toLocaleDateString('en-GB', { 
                                                            day: 'numeric', 
                                                            month: 'short', 
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-gray-900 text-lg">
                                                    {parseFloat(payment.amount_paid).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-2">
                                                    {getPaymentMethodIcon(payment.payment_method)}
                                                    <span className="text-gray-700">{payment.payment_method}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${getPaymentCategoryColor(payment.category)}`}>
                                                    {payment.category}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${getPaymentTypeColor(payment.type)}`}>
                                                    {payment.type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <div className="text-gray-700">
                                                    {new Date(payment.paid_on).toLocaleDateString('en-GB', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(payment.paid_on).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {payment.reference ? (
                                                    <div className="flex items-center group cursor-pointer">
                                                        <span className="text-gray-700 font-semibold text-sm">
                                                            {payment.reference}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No reference</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-2">
                                                <div className="flex items-center gap-1">
                                                    <PaymentActionsMenu
                                                        payment={payment}
                                                        onGenerateReceipt={handleGenerateReceipt}
                                                        onView={openView}
                                                        onEdit={openEdit}
                                                        onDelete={handleDeleteClick}
                                                        showEdit={payment.source !== "stk"}
                                                    />

                                                    <Link 
                                                        href={`/properties/${payment.property.id}/units/${payment.unit.id}?tab=payments`}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Unit"
                                                    >
                                                        <ArrowRightCircle className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        totalCount={count}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                    />

                    {/* Modals */}
                    <PaymentModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        onSubmit={handleUpdateSubmit}
                        mode={modalMode}
                        isPending={updatePaymentMutation.isPending}
                        errors={editErrors}
                        isValidMpesa={isValidMpesa}
                        payment={modalPayment}
                        onEnableEdit={handleEnableEdit}
                    />

                    <PaymentDeleteModal
                        isOpen={isDeleteModalOpen}
                        payment={deletingPayment}
                        isPending={deletePaymentMutation.isPending}
                        onConfirm={handleConfirmDelete}
                        onClose={closeModals}
                    />
                </div>
            </div>
        </div>
    );
};

export default PaymentsPage;