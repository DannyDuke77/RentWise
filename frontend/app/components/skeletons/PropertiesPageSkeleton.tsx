import { Skeleton } from "./Skeleton";
import PropertyCardSkeleton from "./PropertyCardSkeleton";

export default function PropertiesPageSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="h-6 w-32 rounded" />
              </div>
              <Skeleton className="h-10 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}