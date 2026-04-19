'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  required,
  disabled,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('space-y-1.5', className)} ref={ref}>
      {label && (
        <span className="block text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full h-12 px-4 rounded-xl bg-surface-input border text-left text-base transition-all duration-150 outline-none flex items-center justify-between gap-2',
            'focus:border-gold focus:ring-1 focus:ring-gold focus:bg-surface-input-focus',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-error' : 'border-border-default',
            open && 'border-gold ring-1 ring-gold',
          )}
        >
          <span className={selected ? 'text-text-primary' : 'text-text-tertiary'}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={18}
            className={cn(
              'text-text-tertiary transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-surface-overlay border border-border-default rounded-xl shadow-lg overflow-hidden origin-top animate-in fade-in zoom-in-95 duration-150">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors',
                    option.value === value
                      ? 'text-gold bg-gold-muted'
                      : 'text-text-primary hover:bg-surface-elevated',
                  )}
                >
                  {option.label}
                  {option.value === value && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
}
