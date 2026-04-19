import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-surface-elevated rounded-xl animate-pulse',
        className,
      )}
    />
  );
}

/** A skeleton that mimics a text line */
export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
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
    <div className={cn('bg-surface-raised rounded-2xl border border-border-default p-6 space-y-4', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/** A skeleton that mimics a table row */
export function SkeletonRow({ columns = 4, className }: SkeletonProps & { columns?: number }) {
  return (
    <div className={cn('flex items-center gap-4 py-4', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 rounded', i === 0 ? 'w-32' : 'flex-1')}
        />
      ))}
    </div>
  );
}
