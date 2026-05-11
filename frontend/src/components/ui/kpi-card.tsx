import { cn, formatCurrency } from '@/lib/utils';
import { Card } from './card';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: number;
  prefix?: string;
  isCurrency?: boolean;
  className?: string;
  severity?: 'healthy' | 'warning' | 'critical';
}

export function KPICard({
  title,
  value,
  icon,
  change,
  isCurrency,
  className,
  severity,
}: KPICardProps) {
  const severityColors = {
    healthy: 'border-l-4 border-l-success',
    warning: 'border-l-4 border-l-warning',
    critical: 'border-l-4 border-l-error',
  };

  const formattedValue = isCurrency
    ? formatCurrency(Number(value))
    : String(value);

  const [currencySymbol, numericAmount] = formattedValue.includes(' ')
    ? formattedValue.split(' ', 2)
    : ['', formattedValue];

  return (
    <Card className={cn(severity && severityColors[severity], className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[0.6875rem] font-semibold text-text-secondary uppercase tracking-widest truncate">{title}</p>
          <div className="mt-2 flex items-end gap-2 min-w-0">
            {currencySymbol ? (
              <span className="text-xs text-text-secondary shrink-0">{currencySymbol}</span>
            ) : null}
            <p className="min-w-0 text-lg sm:text-xl font-bold text-text-primary font-mono whitespace-normal break-words">{numericAmount}</p>
          </div>
        </div>
        {icon && (
          <div className="shrink-0 p-2 sm:p-2.5 bg-gold-muted rounded-xl text-gold">
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          {change > 0 ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : change < 0 ? (
            <TrendingDown className="w-4 h-4 text-error" />
          ) : (
            <Minus className="w-4 h-4 text-text-tertiary" />
          )}
          <span className={cn(
            'font-medium font-mono',
            change > 0 ? 'text-success' : change < 0 ? 'text-error' : 'text-text-tertiary',
          )}>
            {Math.abs(change)}%
          </span>
          <span className="text-text-tertiary">vs last week</span>
        </div>
      )}
    </Card>
  );
}
