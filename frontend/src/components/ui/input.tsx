import { cn } from '@/lib/utils';
import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  icon?: ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, success, icon, className, required, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={cn(errorId, hintId)}
            className={cn(
              'w-full h-12 px-4 rounded-xl bg-surface-input border text-base text-text-primary placeholder:text-text-tertiary transition-all duration-150 outline-none',
              'focus:border-gold focus:ring-1 focus:ring-gold focus:bg-surface-input-focus',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-base',
              error
                ? 'border-error focus:border-error focus:ring-error'
                : 'border-border-default',
              icon && 'pl-11',
              success && 'pr-11',
              className,
            )}
            {...props}
          />
        {success && !error && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-success">
              <Check size={18} />
            </span>
          )}
        </div>
        {/*
         * Stable height slot for validation/hint text.
         * Prevents the input row from growing when an error appears —
         * a focused input that pushes siblings down on first keystroke is
         * a major source of mobile layout shift inside modals/forms.
         */}
        <div className="min-h-[1.25rem]">
          {error && (
            <p id={errorId} className="flex items-center gap-1.5 text-sm text-error" role="alert">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </p>
          )}
          {hint && !error && (
            <p id={hintId} className="text-sm text-text-tertiary">{hint}</p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
