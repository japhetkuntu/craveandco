'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: string;
  dir: SortDir;
}

/**
 * Client-side sort hook.
 *
 * @param data    - The array to sort (current page's data)
 * @param getValue - Map of sort-key → value accessor. Each accessor returns
 *                   the primitive used for comparison.
 *
 * Clicking a header cycles: unsorted → asc → desc → unsorted
 */
export function useSortable<T>(
  data: T[],
  getValue: Record<string, (row: T) => string | number | null | undefined>,
) {
  const [sort, setSort] = useState<SortState | null>(null);

  function toggle(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null; // third click → clear sort
    });
  }

  const sorted = useMemo(() => {
    if (!sort) return data;
    const fn = getValue[sort.key];
    if (!fn) return data;
    const dir = sort.dir;
    return [...data].sort((a, b) => {
      const av = fn(a);
      const bv = fn(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sort]);

  return { sorted, sort, toggle };
}

interface SortableHeaderProps {
  /** Key passed to useSortable's toggle function */
  col: string;
  sort: SortState | null;
  onToggle: (key: string) => void;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

export function SortableHeader({
  col,
  sort,
  onToggle,
  children,
  className = '',
  align = 'left',
}: SortableHeaderProps) {
  const active = sort?.key === col;
  const dir = active ? sort!.dir : null;
  const isRight = align === 'right';

  return (
    <th
      className={`px-4 py-3 font-medium cursor-pointer select-none whitespace-nowrap transition-colors hover:text-text-primary ${isRight ? 'text-right' : ''} ${active ? 'text-text-primary' : ''} ${className}`}
      onClick={() => onToggle(col)}
    >
      <span className={`inline-flex items-center gap-1 ${isRight ? 'flex-row-reverse' : ''}`}>
        {children}
        <span className={`shrink-0 ${active ? 'text-[var(--color-gold)]' : 'text-text-tertiary/40'}`}>
          {dir === 'asc' ? (
            <ArrowUp size={12} />
          ) : dir === 'desc' ? (
            <ArrowDown size={12} />
          ) : (
            <ArrowUpDown size={12} />
          )}
        </span>
      </span>
    </th>
  );
}
