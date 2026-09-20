import { Skeleton } from "./Skeleton";
import TableSkeleton from "./TableSkeleton";

export default function PaymentsPageSkeleton() {
  return (
    <div className="max-w-8xl space-y-8 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-3">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>

      {/* Analytics */}
      <Skeleton className="h-32 rounded-2xl" />

      {/* Table container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-56 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
          </div>
        </div>

        <TableSkeleton rows={10} cols={9} rowSize="h-10" />
      </div>
    </div>
  );
}