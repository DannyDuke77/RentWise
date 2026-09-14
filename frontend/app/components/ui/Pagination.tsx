"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [1, 2, 10, 25, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Page Size & Range Info */}
        <div className="text-sm flex items-center text-gray-600">
          <p>
            Showing <span className="font-semibold">{startItem}</span> to{" "}
            <span className="font-semibold">{endItem}</span> of{" "}
            <span className="font-semibold">{totalCount}</span> results
          </p>

          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="ml-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-2 border-2 border-stone-200 rounded-xl bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed text-stone-800 transition-colors cursor-pointer"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="p-2 border-2 border-stone-200 rounded-xl bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed text-stone-800 transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all cursor-pointer ${
                    page === pageNum
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && <span className="text-gray-500">...</span>}

            {totalPages > 5 && (
              <button
                onClick={() => onPageChange(totalPages)}
                className={`w-10 h-10 rounded-lg font-medium transition-all cursor-pointer ${
                  page === totalPages
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {totalPages}
              </button>
            )}
          </div>

          <button
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2 border-2 border-stone-200 rounded-xl bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed text-stone-800 transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="p-2 border-2 border-stone-200 rounded-xl bg-white hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed text-stone-800 transition-colors cursor-pointer"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current Page Indicator */}
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">Page</span>
          <span className="font-bold text-blue-600">{page}</span>
          <span className="mx-2">of</span>
          <span className="font-semibold">{totalPages}</span>
        </div>
      </div>
    </div>
  );
};

export default Pagination;