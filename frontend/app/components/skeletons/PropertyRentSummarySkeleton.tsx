import { Skeleton } from "./Skeleton";

export default function PropertyRentSummarySkeleton() {
  return (
    <div className="space-y-5 pt-3">
      {/* Collection Rate */}
      <div className="bg-slate-100 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-40 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        </div>
        <Skeleton className="h-3 rounded-full" />
      </div>

      {/* Unit Status Grid */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-slate-100">
            <Skeleton className="h-3 w-12 mx-auto rounded mb-2" />
            <Skeleton className="h-6 w-8 mx-auto rounded" />
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl p-6 bg-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="w-9 h-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl p-6 bg-slate-100">
            <Skeleton className="h-3 w-24 rounded mb-2" />
            <Skeleton className="h-5 w-32 rounded mb-1" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Action Button */}
      <Skeleton className="h-12 rounded-xl" />
    </div>
  );
}