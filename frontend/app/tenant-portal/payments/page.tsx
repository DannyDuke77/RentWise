"use client";

import { useState } from "react";
import {
  Receipt, Calendar, Home, HandCoins, CardSim, Landmark,
  CircleDollarSign, Info, AlertCircle,
} from "lucide-react";
import { useTenantPayments } from "@/app/hooks/queries/useTenantPaymentsQueries";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Pagination from "@/app/components/ui/Pagination";
import TenantPaymentsSkeleton from "@/app/components/skeletons/TenantPaymentsSkeleton";


const getPaymentMethodIcon = (method: string) => {
  switch (method?.toLowerCase()) {
    case "bank":
      return <Landmark className="w-4 h-4" />;
    case "cash":
      return <HandCoins className="w-4 h-4" />;
    case "mpesa":
      return <CardSim className="w-4 h-4" />;
    default:
      return <CircleDollarSign className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case "rent":
      return "bg-blue-100 text-blue-800";
    case "deposit":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case "payment":
      return "bg-emerald-100 text-emerald-800";
    case "refund":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function TenantPaymentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isPending, isError, isFetching } = useTenantPayments(
    page,
    pageSize
  );

  const payments = data?.results ?? [];
  const count = data?.count ?? 0;

  if (isPending) {
    return <TenantPaymentsSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 p-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm font-medium text-red-600">
          Unable to load your payment history.
        </p>
        <p className="text-xs text-gray-500">
          Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <span className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
              <Receipt className="w-6 h-6 text-white" />
            </span>
            Payment History
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            View your rent and deposit payment history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Total Records
            </span>
            <span className="ml-2 font-semibold text-gray-900">{count}</span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Payments</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {payments.length} of {count} payments
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Date
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Home className="w-4 h-4 mr-2" />
                    Property / Unit
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Method
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Reference
                </th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount (KES)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-5 bg-gray-100 rounded-2xl">
                        <Receipt
                          className="w-12 h-12 text-gray-300"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-gray-500 font-medium text-lg">
                        No payments yet
                      </p>
                      <p className="text-sm text-gray-400">
                        Your payment history will appear here once you make a
                        payment.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-blue-50/30 transition-all duration-200"
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {new Date(payment.paid_on).toLocaleDateString("en-GB", {
                          day: "numeric",
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

                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                          <Home className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 whitespace-nowrap">
                            {payment.property.name}
                          </p>
                          <p className="font-medium text-gray-900">
                            Unit {payment.unit.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${getCategoryColor(
                          payment.category
                        )}`}
                      >
                        {payment.category}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-gray-700">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span className="capitalize">
                          {payment.payment_method}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${getTypeColor(
                          payment.type
                        )}`}
                      >
                        {payment.type}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      {payment.reference ? (
                        <span className="text-gray-700 font-mono text-sm font-semibold">
                          {payment.reference}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          No reference
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span
                        className={`font-bold text-lg ${
                          payment.type === "refund"
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {payment.type === "refund" ? "-" : "+"}{" "}
                        {Number(payment.amount_paid).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {count > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={count}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Info Tip */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Info className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-800">
            About your payment history
          </p>
          <p className="text-sm text-blue-600/70 mt-0.5">
            All payments are recorded with timestamp verification. Contact your
            landlord if you notice any discrepancies.
          </p>
        </div>
      </div>
    </div>
  );
}