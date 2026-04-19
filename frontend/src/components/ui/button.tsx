'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'danger-ghost' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  children,
  className,
  loading,
  disabled,
  icon,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-gold text-text-inverse hover:bg-gold-dark',
    secondary: 'bg-surface-raised text-text-primary border border-border-default hover:bg-surface-elevated hover:border-border-strong',
    danger: 'bg-error text-text-inverse hover:brightness-110',
    'danger-ghost': 'bg-transparent text-error hover:bg-error-muted',
    ghost: 'text-gold hover:bg-gold-muted hover:text-gold-dark',
  };

  const sizes = {
    sm: 'h-9 px-4 text-[13px] gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-[52px] px-7 text-base gap-2',
  };

  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
