'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X, Check } from 'lucide-react';

export interface ComboboxIngredient {
  id: string;
  name: string;
  unit: string;
}

interface IngredientComboboxProps {
  ingredients: ComboboxIngredient[];
  value: string;
  onChange: (id: string) => void;
  /** Called when the user types — use this to trigger a server-side search */
  onSearch?: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function IngredientCombobox({
  ingredients,
  value,
  onChange,
  onSearch,
  loading = false,
  placeholder = 'Search ingredients…',
  label,
  required,
}: IngredientComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = ingredients.find((i) => i.id === value) ?? null;

  // Client-side filter on top of whatever the server returned
  const results = query.trim()
    ? ingredients.filter(
        (i) =>
          i.name.toLowerCase().includes(query.toLowerCase()) ||
          i.unit.toLowerCase().includes(query.toLowerCase()),
      )
    : ingredients;

  useEffect(() => {
    setHighlighted(0);
  }, [results.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlighted]) handleSelect(results[highlighted].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}

      {/* Hidden input for form required validation */}
      {required && (
        <input
          type="text"
          readOnly
          value={value}
          required
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none h-0 w-0"
        />
      )}

      {selected ? (
        /* ── Selected chip ── */
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/5 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary leading-tight truncate">
              {selected.name}
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">{selected.unit}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-white/80 text-text-tertiary hover:bg-error-muted hover:text-error transition-colors"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* ── Search input ── */
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              onSearch?.(e.target.value);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border-default bg-surface-input text-sm text-text-primary outline-none focus:border-[var(--color-gold)] transition-colors"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
          />
        </div>
      )}

      {/* ── Dropdown ── */}
      {open && !selected && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-2xl border border-border-default bg-white shadow-xl overflow-hidden max-h-60 overflow-y-auto"
        >
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-text-tertiary">
              {loading ? 'Searching…' : 'No ingredients match'}
            </li>
          ) : (
            results.map((ing, idx) => (
              <li
                key={ing.id}
                role="option"
                aria-selected={idx === highlighted}
                onMouseEnter={() => setHighlighted(idx)}
                onMouseDown={() => handleSelect(ing.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none ${
                  idx === highlighted
                    ? 'bg-[var(--color-gold)]/8 text-text-primary'
                    : 'hover:bg-surface-elevated'
                } ${idx !== 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                    {ing.name}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-text-tertiary bg-surface-elevated rounded-full px-2.5 py-0.5">
                  {ing.unit}
                </span>
                {idx === highlighted && (
                  <Check size={13} className="shrink-0 text-[var(--color-gold)]" />
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
