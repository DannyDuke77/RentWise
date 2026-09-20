import { Skeleton } from "./Skeleton";
import UnitsRowsSkeleton from "./UnitsRowsSkeleton";

export default function PropertyDetailSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-8 mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="h-5 w-56 rounded" />
      </div>

      {/* Rent Summary — collapsed card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>

      {/* Payment Analytics — collapsed card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-4 w-56 rounded" />
            </div>
          </div>
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>

      {/* Units Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 sm:p-6">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>

        <UnitsRowsSkeleton />
      </div>
    </div>
  );
}