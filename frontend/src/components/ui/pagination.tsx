'use client';

import { Button } from './button';

interface PaginationProps {
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  hasMore?: boolean;
  pageSizes?: number[];
}

export function PaginationControls({
  page,
  limit,
  onPageChange,
  onLimitChange,
  hasMore,
  pageSizes = [10, 25, 50],
}: PaginationProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={page <= 0}
          onClick={() => onPageChange(Math.max(page - 1, 0))}
        >
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={hasMore === false}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
        <span className="text-sm text-text-secondary">
          Page {page + 1}
        </span>
      </div>
      {onLimitChange && (
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Page size</span>
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="rounded-xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
