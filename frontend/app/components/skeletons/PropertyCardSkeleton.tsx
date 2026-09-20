import { Skeleton } from "./Skeleton";

export default function PropertyCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Main info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Skeleton className="hidden sm:block w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        </div>

        {/* Occupancy + actions */}
        <div className="flex items-center justify-between lg:justify-end gap-6 border-t border-slate-100 pt-4 lg:pt-0 lg:border-t-0">
          <div className="flex flex-col min-w-[140px] gap-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}