import { useState, useEffect } from 'react';

export function useFilterWithPagination(initialPage = 1) {
    const [page, setPage] = useState(initialPage);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("");

    const resetPage = () => setPage(1);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, paymentMethod, filterDate, filterType]);

    const clearFilters = () => {
        setSearchTerm("");
        setPaymentMethod("");
        setFilterDate("");
        setFilterType("");
        setPage(1);
    };

    return {
        page,
        setPage,
        searchTerm,
        setSearchTerm,
        paymentMethod,
        setPaymentMethod,
        filterDate,
        setFilterDate,
        filterType,
        setFilterType,
        clearFilters,
        resetPage
    };
}