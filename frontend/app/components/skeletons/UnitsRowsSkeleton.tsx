import { Skeleton } from "./Skeleton";

export default function UnitsRowsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-14 p-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="space-y-2 min-w-0 flex-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
            <Skeleton className="hidden md:block h-7 w-20 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}