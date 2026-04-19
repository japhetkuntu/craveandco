'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// ---------- Desktop Table ----------

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  className?: string;
  /** Render function for mobile card view */
  renderCard?: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  className,
  renderCard,
}: TableProps<T>) {
  const alignClass = (align?: string) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <>
      {/* Desktop table */}
      <div className={cn('hidden md:block overflow-x-auto', className)}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-[0.6875rem] font-semibold text-text-secondary uppercase tracking-widest',
                    alignClass(col.align),
                    col.sortable && 'cursor-pointer select-none hover:text-text-primary transition-colors',
                    col.className,
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border-subtle transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-elevated',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-4 text-sm',
                      alignClass(col.align),
                      col.align === 'right' && 'font-mono',
                      col.className,
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className={cn('md:hidden space-y-3', className)}>
        {data.map((row) =>
          renderCard ? (
            <div key={keyExtractor(row)}>{renderCard(row)}</div>
          ) : (
            <div
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'bg-surface-raised border border-border-default rounded-xl p-4 space-y-2',
                onRowClick && 'cursor-pointer active:bg-surface-elevated',
              )}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className={cn('text-sm text-text-primary', col.align === 'right' && 'font-mono')}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}
