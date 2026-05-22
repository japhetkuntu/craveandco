'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportToCSV, exportToXLSX, stampedName, type ExportSheet } from '@/lib/export';

interface ExportButtonProps {
  /** One sheet = simple export; multiple sheets = multi-tab Excel */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sheets: ExportSheet<any>[];
  /** Base filename (date stamp is appended automatically) */
  filename: string;
  /** Optional label override */
  label?: string;
  disabled?: boolean;
}

export function ExportButton({ sheets, filename, label = 'Export', disabled = false }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCSV = () => {
    // For CSV, export each sheet as a separate file
    if (sheets.length === 1) {
      exportToCSV(sheets[0], stampedName(filename));
    } else {
      sheets.forEach((s) => exportToCSV(s, stampedName(`${filename}-${s.name}`)));
    }
    setOpen(false);
  };

  const handleXLSX = () => {
    exportToXLSX(sheets, stampedName(filename));
    setOpen(false);
  };

  const totalRows = sheets.reduce((n, s) => n + s.data.length, 0);
  const isEmpty = totalRows === 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled || isEmpty}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition-all select-none ${
          disabled || isEmpty
            ? 'border-border-subtle text-text-tertiary cursor-not-allowed opacity-50'
            : 'border-[var(--color-gold)]/40 bg-[var(--color-gold)]/5 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 active:scale-95'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Download size={15} strokeWidth={2.2} />
        {label}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl border border-border-default bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-border-subtle">
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Download as</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              {totalRows.toLocaleString()} row{totalRows !== 1 ? 's' : ''}
              {sheets.length > 1 ? `, ${sheets.length} sheets` : ''}
            </p>
          </div>

          {/* Options */}
          <button
            type="button"
            onClick={handleXLSX}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-elevated transition-colors text-left"
          >
            <span className="w-8 h-8 rounded-xl bg-success-muted flex items-center justify-center shrink-0">
              <FileSpreadsheet size={16} className="text-success" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary leading-tight">Excel (.xlsx)</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {sheets.length > 1 ? `${sheets.length} tabs, formatted` : 'Formatted spreadsheet'}
              </p>
            </div>
          </button>

          <div className="mx-4 border-t border-border-subtle" />

          <button
            type="button"
            onClick={handleCSV}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-elevated transition-colors text-left"
          >
            <span className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0">
              <FileText size={16} className="text-text-secondary" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary leading-tight">CSV (.csv)</p>
              <p className="text-xs text-text-tertiary mt-0.5">Plain text, any app</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
