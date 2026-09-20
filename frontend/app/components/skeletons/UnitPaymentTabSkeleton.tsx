import { Skeleton } from "./Skeleton";
import TableSkeleton from "./TableSkeleton";

export default function PaymentTabSkeleton() {
  return (
    <div className="space-y-8 md:px-2 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <Skeleton className="h-7 w-56 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>

      {/* Balance Overview — dark card, use lighter skeleton inside it */}
      <div className="rounded-lg bg-slate-900 p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 rounded bg-slate-700" />
            <Skeleton className="h-12 w-64 rounded bg-slate-700" />
            <div className="flex items-center gap-6">
              <Skeleton className="h-5 w-40 rounded bg-slate-700" />
              <Skeleton className="h-5 w-32 rounded bg-slate-700" />
            </div>
          </div>
          <Skeleton className="w-20 h-20 rounded-2xl bg-slate-700" />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-36 rounded" />
            <Skeleton className="h-10 w-40 rounded" />
          </div>
        </div>
      </div>

      {/* Ledger header + filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-56 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
      </div>

      {/* Ledger table */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <TableSkeleton rows={10} cols={5} />
      </div>
    </div>
  );
}