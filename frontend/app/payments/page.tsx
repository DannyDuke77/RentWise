"use client";

import { useEffect, useState } from "react";
import apiService from "../services/apiService";
import { ChevronLeft, ChevronRight, Loader2, Calendar, DollarSign, CreditCard, Home, FileText, ExternalLink } from "lucide-react";

interface Payment {
  id: string;
  tenancy: string;
  tenancy_start: string;
  unit_name: string;
  amount_paid: string;
  payment_method: string;
  type: string;
  paid_on: string;
  paid_for: string;
  reference: string | null;
}

interface PaginatedPayments {
  results: Payment[];
  next: string | null;
  previous: string | null;
  count: number;
}

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<{ next: string | null; previous: string | null; count: number }>({ next: null, previous: null, count: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchPayments = async (pageNum: number) => {
    setLoading(true);
    try {
      const data: PaginatedPayments = await apiService.get(`/api/properties/payments/?page=${pageNum}&page_size=${pageSize}`);
      setPayments(data.results);
      setPagination({ next: data.next, previous: data.previous, count: data.count });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(page);
  }, [page]);

  const handlePrev = () => {
    if (pagination.previous) setPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    if (pagination.next) setPage((p) => p + 1);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return <CreditCard className="w-4 h-4" />;
      case 'bank transfer':
        return <FileText className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rent':
        return "bg-blue-100 text-blue-800";
      case 'deposit':
        return "bg-green-100 text-green-800";
      case 'fee':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
              <p className="text-gray-600 mt-2">Track and manage all payment transactions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg shadow-sm px-4 py-2">
                <span className="text-sm text-gray-600">Total Records:</span>
                <span className="ml-2 font-semibold text-gray-900">{pagination.count}</span>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Home className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Unique Units</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {[...new Set(payments.map(p => p.unit_name))].length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Current Page</p>
                  <p className="text-2xl font-bold text-gray-900">{page}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Payment Methods</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {[...new Set(payments.map(p => p.payment_method))].length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Loading payments...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the data</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
                <p className="text-sm text-gray-600 mt-1">Showing {payments.length} of {pagination.count} payments</p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="">
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
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid On</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((p, index) => (
                      <tr 
                        key={p.id} 
                        className="hover:bg-blue-50/30 transition-all duration-200 hover:shadow-sm"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                              <Home className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{p.unit_name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[120px]">{p.tenancy}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">{p.tenancy_start}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-bold text-gray-900 text-lg">
                              ${parseFloat(p.amount_paid).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {getPaymentMethodIcon(p.payment_method)}
                            <span className="text-gray-700">{p.payment_method}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(p.type)}`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-700">
                            {new Date(p.paid_on).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            <p className="text-xs text-gray-500">
                              {new Date(p.paid_on).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {p.reference ? (
                            <div className="flex items-center group cursor-pointer">
                              <span className="text-gray-700 group-hover:text-blue-600 transition-colors truncate max-w-[120px]">
                                {p.reference}
                              </span>
                              <ExternalLink className="w-4 h-4 ml-2 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
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
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-semibold">
                      {Math.min(page * pageSize, pagination.count)}
                    </span>{" "}
                    of <span className="font-semibold">{pagination.count}</span> results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrev}
                      disabled={!pagination.previous}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                        pagination.previous
                          ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-sm active:scale-95"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      {Array.from({ length: Math.min(5, Math.ceil(pagination.count / pageSize)) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              page === pageNum
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {Math.ceil(pagination.count / pageSize) > 5 && (
                        <span className="text-gray-500">...</span>
                      )}
                    </div>
                    
                    <button
                      onClick={handleNext}
                      disabled={!pagination.next}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                        pagination.next
                          ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-sm active:scale-95"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Next
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">Page</span>
                    <span className="font-bold text-blue-600">{page}</span>
                    <span className="mx-2">of</span>
                    <span className="font-semibold">{Math.ceil(pagination.count / pageSize)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;