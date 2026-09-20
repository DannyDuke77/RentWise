import { Skeleton } from "./Skeleton";
import TableSkeleton from "./TableSkeleton";

export default function TenantPaymentsSkeleton() {
  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Table container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <Skeleton className="h-5 w-32 rounded mb-2" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <TableSkeleton rows={10} cols={7} />
      </div>

      {/* Info tip */}
      <Skeleton className="h-20 rounded-xl" />
    </div>
  );
}