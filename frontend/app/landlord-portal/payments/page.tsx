"use client";

import { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import { ChevronLeft, ChevronRight, Loader2, Calendar, DollarSign, CreditCard, Home, FileText, ExternalLink, HandCoins, CardSim, Landmark, CircleDollarSign, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { usePayments, usePaymentAnalytics } from "@/app/hooks/queries/usePaymentsQueries";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import PaymentStats from "@/app/components/payments/PaymentStats";
import Pagination from "@/app/components/ui/Pagination";
import { Payment } from "@/app/src/types/Types";


const PaymentsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("");

  const { data: paymentData, isLoading: paymentsLoading, } = usePayments(page, pageSize);

  const rawPayments: Payment[] = paymentData?.results ?? [];

  const count = paymentData?.count ?? 0;

  const filteredPayments = rawPayments.filter((payment: Payment) => {
    const matchesFilterMethod = filterMethod ? payment.payment_method === filterMethod : true;
    const matchesDate = !filterDate || payment.paid_on.startsWith(filterDate);
    const matchesType = !filterType || payment.type === filterType;
    const matchesSearch =
      payment.unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.reference && payment.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch && matchesFilterMethod && matchesDate && matchesType;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterMethod("");
    setFilterDate("");
    setFilterType("");
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bank':
        return <Landmark className="w-5 h-5" />;
      case 'cash':
        return <HandCoins className="w-5 h-5" />;
      case 'mpesa':
        return <CardSim className="w-5 h-5" />
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment':
        return "bg-green-100 text-green-800";
      case 'refund':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (paymentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner
          size="lg"
          color="blue-600"
          label="Fetching payments..."
          showTimer={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-8xl space-y-8 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="flex items-center space-x-3 ">
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
        <PaymentStats label="Payment Analytics"  />

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <>
              {/* Table Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Payments</h2>
                  <p className="text-sm text-gray-600 mt-1">Showing {filteredPayments.length} of {count} payments</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search unit name or reference..."
                                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-72 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <select
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            value={filterMethod}
                            onChange={e => setFilterMethod(e.target.value)}
                        >
                            <option value="">All Methods</option>
                            <option value="mpesa">M-Pesa</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cash">Cash</option>
                        </select>

                        <select
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
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
                            onChange={e => setFilterDate(e.target.value)}
                        /> 
                        
                        {(filterMethod || filterDate || searchTerm || filterType) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-w-[calc(100vw-2rem)]">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Home className="w-4 h-4 mr-2" />
                          Unit
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
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid On</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment: Payment, index) => (
                      <tr 
                        key={payment.id} 
                        className="hover:bg-blue-50/30 transition-all duration-200 hover:shadow-sm"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                              <Home className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{payment.unit_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">
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
                      </tr>
                    ))}
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
            </>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;