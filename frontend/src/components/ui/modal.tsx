'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', handleKey);

    // Trap focus
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable?.length) focusable[0].focus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={cn(
          'relative w-full bg-surface-raised border border-border-default p-6',
          // Mobile: bottom sheet, Desktop: centered modal
          'rounded-t-2xl sm:rounded-2xl',
          'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-250',
          'max-h-[90%] overflow-hidden',
          sizes[size],
        )}
      >
        {/* Header */}
        {(title || true) && (
          <div className="sticky top-0 z-10 flex items-center justify-between mb-4 bg-surface-raised/95 backdrop-blur-sm py-2">
            {title && <h3 className="text-xl font-semibold text-text-primary">{title}</h3>}
            <button
              onClick={onClose}
              className="p-2 -m-2 text-text-tertiary hover:text-text-secondary rounded-lg transition-colors ml-auto"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90%-4.5rem)]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
