import { Skeleton } from "./Skeleton";

export default function TenantPortalSkeleton() {
  return (
    <div className="space-y-6 p-6 lg:p-8 pb-24 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3.5">
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-6 w-56 rounded" />
            <Skeleton className="h-3 w-72 rounded" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Financial Banner */}
      <Skeleton className="rounded-2xl h-52" />

      {/* Contact Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>

      {/* Tenancies Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-6 w-40 rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </section>
    </div>
  );
}