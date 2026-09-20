import { Skeleton } from "./Skeleton";

export const DetailsTabSkeleton = () => (
    <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <Skeleton className="w-48 h-6" />
            <div className="flex items-center gap-4">
                <Skeleton className="w-28 h-9" />
                <Skeleton className="w-28 h-9" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
                <div key={i} className="">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="w-36 h-6" />
                            <Skeleton className="w-24 h-3" />
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map(j => (
                            <div key={j} className="flex gap-3">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="w-20 h-2" />
                                    <Skeleton className="w-44 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);