import { useSyncExternalStore } from 'react';

let globalDate = new Date(); 

let dateSnapshot = globalDate;

const listeners = new Set<() => void>();

export const timeStore = {
    getDate() {
        return dateSnapshot;
    },
    
    setDate(newDate: Date) {
        if (newDate.getTime() !== globalDate.getTime()) {
            globalDate = newDate;
            dateSnapshot = new Date(newDate);
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
        timeStore.getDate,
        timeStore.getDate
    );
}

export const formatDate = (dateValue: string | Date | null | undefined, includeTime: boolean = true) => {
    if (!dateValue) return "N/A";

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    
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