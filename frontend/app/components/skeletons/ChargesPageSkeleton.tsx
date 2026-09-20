import { Skeleton } from "./Skeleton";
import TableSkeleton from "./TableSkeleton";

export default function ChargesPageSkeleton() {
  return (
    <div className="max-w-8xl space-y-8 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-40 rounded-lg" />
              <Skeleton className="h-4 w-56 rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-64 rounded-full" />
          </div>
        </div>
        <Skeleton className="mt-4 h-10 rounded-lg" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="w-11 h-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

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
            </div>
          </div>
        </div>
        <TableSkeleton rows={10} cols={7} rowSize="h-6" />
      </div>
    </div>
  );
}