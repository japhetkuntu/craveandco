'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Hide the close button (e.g. for confirmations that require an explicit choice). */
  hideClose?: boolean;
}

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
    }
    document.addEventListener('keydown', handleKey);

    // Focus first focusable element inside the panel
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable?.length) {
      focusable[0].focus();
    } else {
      panelRef.current?.focus();
    }

    // Lock body scroll without layout shift
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div
        className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-surface-raised border border-border-default shadow-[var(--shadow-modal)]',
          // Mobile: bottom sheet, full-bleed, rounded top. Desktop: centered card.
          'rounded-t-2xl sm:rounded-2xl',
          'flex flex-col max-h-[92vh] sm:max-h-[85vh]',
          'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 sm:motion-safe:slide-in-from-bottom-2 motion-safe:duration-250',
          SIZES[size],
        )}
      >
        {/* Mobile drag-handle affordance */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-border-strong/50" />
        </div>

        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-3 sm:pt-5 pb-3 shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-lg sm:text-xl font-semibold text-text-primary leading-snug">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-text-secondary leading-normal">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 w-9 h-9 -mt-1 -mr-1 inline-flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
              >
                <X size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Content (scrolls) */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4">{children}</div>

        {/* Footer — sticky at panel bottom on every viewport */}
        {footer && (
          <div className="shrink-0 border-t border-border-subtle bg-surface-raised/95 backdrop-blur-sm px-5 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
