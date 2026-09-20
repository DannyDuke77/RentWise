import { Skeleton } from "./Skeleton";

export default function PaymentAnalyticsSkeleton() {
  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-7 w-28 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}