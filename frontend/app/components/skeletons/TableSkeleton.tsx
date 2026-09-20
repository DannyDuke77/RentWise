import { Skeleton } from "./Skeleton";

export default function TableSkeleton({
  rows = 8,
  cols = 5,
  rowSize = "h-4",
  headerVisible = true,
}: {
  rows?: number;
  cols?: number;
  rowSize?: string;
  headerVisible?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {headerVisible && (
        <div className="flex gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1 rounded" />
          ))}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`${rowSize} flex-1 rounded`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}