'use client';

import React from 'react';
import { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps<TData> {
  table: Table<TData>;
  itemName?: string;
}

export default function TablePagination<TData>({
  table,
  itemName = 'records',
}: TablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();

  return (
    <div className="p-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/20">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground outline-hidden focus:border-blue-500 cursor-pointer"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          Showing <span className="font-semibold text-foreground">{startRow}</span> to{' '}
          <span className="font-semibold text-foreground">{endRow}</span> of{' '}
          <span className="font-semibold text-foreground">{totalRows}</span> {itemName}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium mr-1 text-[11px]">
          Page {pageIndex + 1} of {Math.max(1, pageCount)}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-foreground"
            title="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-foreground"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-foreground"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-foreground"
            title="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
