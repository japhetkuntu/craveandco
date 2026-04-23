import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('bg-surface-elevated rounded-xl animate-pulse', className)}
      aria-hidden="true"
    />
  );
}

/** A skeleton that mimics a text line */
export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 rounded', i === lines - 1 && lines > 1 && 'w-3/4')}
        />
      ))}
    </div>
  );
}

/** A skeleton that mimics a KPI card */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-surface-raised rounded-2xl border border-border-default p-6 space-y-4',
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** A skeleton that mimics a table row */
export function SkeletonRow({ columns = 4, className }: SkeletonProps & { columns?: number }) {
  return (
    <div className={cn('flex items-center gap-4 py-4', className)} aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 rounded', i === 0 ? 'w-32' : 'flex-1')}
        />
      ))}
    </div>
  );
}

/**
 * A full-page loading state matching the structure of dashboard pages:
 * page header → KPI grid → content section. Use this in place of bare spinners
 * to avoid layout shift and feel of "nothing is happening".
 */
export function PageSkeleton({
  kpiCount = 4,
  showHeader = true,
  showSection = true,
  className,
}: {
  kpiCount?: number;
  showHeader?: boolean;
  showSection?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('space-y-6', className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading"
    >
      {showHeader && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: kpiCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {showSection && (
        <div className="bg-surface-raised rounded-2xl border border-border-default p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            <SkeletonRow columns={4} />
            <SkeletonRow columns={4} />
            <SkeletonRow columns={4} />
            <SkeletonRow columns={4} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A small inline spinner for buttons/contexts where a full page skeleton
 * is overkill. Prefer `PageSkeleton` for initial page loads.
 */
export function Spinner({
  size = 20,
  className,
  label = 'Loading',
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center text-gold', className)}
    >
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>
  );
}
