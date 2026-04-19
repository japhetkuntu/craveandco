import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'w-full min-w-0 bg-surface-raised rounded-2xl border border-border-default p-4 sm:p-6 transition-all duration-150',
        onClick && 'cursor-pointer hover:border-border-strong hover:bg-surface-elevated',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-start justify-between gap-3 mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-[0.6875rem] font-semibold text-text-secondary uppercase tracking-widest', className)}>{children}</h3>;
}

export function CardActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-w-0', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-4 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-end gap-3', className)}>{children}</div>;
}
