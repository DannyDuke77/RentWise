'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * One QueryClient instance per browser session, created lazily so it
 * survives re-renders but isn't shared across different users on the
 * server (each request gets its own via useState's lazy initializer
 * running once per component instance).
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Sensible default for most data in the app; override
                        // per-query where something is known to be more static
                        // (e.g. business profile, charge types) or more volatile.
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>);
}