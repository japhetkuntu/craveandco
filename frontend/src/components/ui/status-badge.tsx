import { cn } from '@/lib/utils';

const variants: Record<string, { bg: string; text: string; dot: string }> = {
  new: { bg: 'bg-warning-muted', text: 'text-warning', dot: 'bg-warning' },
  pending: { bg: 'bg-warning-muted', text: 'text-warning', dot: 'bg-warning' },
  preparing: { bg: 'bg-info-muted', text: 'text-info', dot: 'bg-info' },
  cooking: { bg: 'bg-info-muted', text: 'text-info', dot: 'bg-info' },
  ready: { bg: 'bg-success-muted', text: 'text-success', dot: 'bg-success' },
  completed: { bg: 'bg-surface-elevated', text: 'text-text-secondary', dot: 'bg-text-tertiary' },
  cancelled: { bg: 'bg-error-muted', text: 'text-error', dot: 'bg-error' },
  delayed: { bg: 'bg-error-muted', text: 'text-error', dot: 'bg-error' },
  open: { bg: 'bg-warning-muted', text: 'text-warning', dot: 'bg-warning' },
  resolved: { bg: 'bg-success-muted', text: 'text-success', dot: 'bg-success' },
  critical: { bg: 'bg-error-muted', text: 'text-error', dot: 'bg-error' },
  warning: { bg: 'bg-warning-muted', text: 'text-warning', dot: 'bg-warning' },
  info: { bg: 'bg-info-muted', text: 'text-info', dot: 'bg-info' },
  healthy: { bg: 'bg-success-muted', text: 'text-success', dot: 'bg-success' },
  draft: { bg: 'bg-surface-elevated', text: 'text-text-tertiary', dot: 'bg-text-tertiary' },
  running: { bg: 'bg-gold-muted', text: 'text-gold', dot: 'bg-gold' },
  active: { bg: 'bg-gold-muted', text: 'text-gold', dot: 'bg-gold' },
  partiallyreceived: { bg: 'bg-warning-muted', text: 'text-warning', dot: 'bg-warning' },
};

const defaultVariant = { bg: 'bg-surface-elevated', text: 'text-text-secondary', dot: 'bg-text-tertiary' };

interface StatusBadgeProps {
  status: string;
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ status, className, pulse }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/_/g, '');
  const v = variants[key] || defaultVariant;
  const isCritical = key === 'critical' || key === 'delayed';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
        v.bg,
        v.text,
        (pulse || isCritical) && 'animate-pulse',
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', v.dot)} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}
