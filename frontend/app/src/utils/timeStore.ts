import { useSyncExternalStore } from 'react';

// 1. Internal state
let globalDate = new Date(); 

// 2. The CACHED snapshot. 
// We return THIS variable to ensure the reference stays the same between renders.
let dateSnapshot = globalDate;

const listeners = new Set<() => void>();

export const timeStore = {
    // This is the function passed to getServerSnapshot/getSnapshot
    getDate() {
        return dateSnapshot;
    },
    
    setDate(newDate: Date) {
        // Only update and notify if the time actually changed
        if (newDate.getTime() !== globalDate.getTime()) {
            globalDate = newDate;
            dateSnapshot = new Date(newDate); // Create a new stable reference
            listeners.forEach((listener) => listener());
        }
    },

    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
};

export function useToday() {
    return useSyncExternalStore(
        timeStore.subscribe,
        timeStore.getDate, // Client snapshot
        timeStore.getDate  // Server snapshot (now stable and cached)
    );
}

export const formatDate = (dateValue: string | Date | null | undefined, includeTime: boolean = true) => {
    if (!dateValue) return "N/A";

    // If it's already a Date object, use it; otherwise, try to parse the string
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid Date";

    const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...(includeTime && {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }),
    };

    return new Intl.DateTimeFormat("en-US", options).format(date);
};