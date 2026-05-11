'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageSkeleton } from '@/components/ui/skeleton';

interface PrepItem {
  menuItemId: string;
  menuItem: string;
  totalQuantity: number;
}

export default function KitchenPrepPage() {
  const { token } = useAuth();
  const [prep, setPrep] = useState<PrepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const today = new Date().toLocaleDateString('en-GH', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const todayISO = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!token) return;
    get(`/api/v1/kitchen/prep-list${buildQueryString({ date: todayISO, page: 0, limit: 100 })}`, token)
      .then(setPrep)
      .catch((err) => toast('error', 'Could not load prep list', err instanceof Error ? err.message : 'Please try again.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const remaining = prep.filter((p) => !checked.has(p.menuItemId));
  const done = prep.filter((p) => checked.has(p.menuItemId));
  const allDone = prep.length > 0 && remaining.length === 0;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <ClipboardList className="text-[var(--color-gold)]" size={22} /> Prep List
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">{today}</p>
      </div>

      {prep.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CheckCircle2 size={52} className="text-success opacity-40" />
          <p className="text-base font-semibold text-text-secondary">No prep needed today!</p>
          <p className="text-sm text-text-tertiary">All items are accounted for</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-primary">
                {allDone ? '🎉 All prepped!' : `${checked.size} of ${prep.length} done`}
              </span>
              {checked.size > 0 && (
                <button onClick={() => setChecked(new Set())} className="text-xs text-text-tertiary hover:text-text-secondary underline">
                  Reset
                </button>
              )}
            </div>
            <div className="w-full h-3 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-success transition-all duration-500"
                style={{ width: prep.length ? `${(checked.size / prep.length) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* Pending items */}
          {remaining.length > 0 && (
            <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle">
                <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                  To Prep ({remaining.length})
                </p>
              </div>
              <div className="divide-y divide-border-subtle">
                {remaining.map((item) => (
                  <button
                    key={item.menuItemId}
                    onClick={() => toggle(item.menuItemId)}
                    className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-surface-elevated active:bg-surface-elevated transition-colors"
                  >
                    {/* Quantity badge */}
                    <span className="shrink-0 w-14 h-14 rounded-2xl bg-[var(--color-gold)] text-white text-2xl font-black flex items-center justify-center">
                      {item.totalQuantity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-text-primary">{item.menuItem}</p>
                      <p className="text-sm text-text-tertiary mt-0.5">Tap to mark as done</p>
                    </div>
                    <div className="shrink-0 w-6 h-6 rounded-full border-2 border-border-default" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Completed items */}
          {done.length > 0 && (
            <div className="rounded-3xl border border-success/20 bg-success-muted overflow-hidden">
              <div className="px-4 py-3 border-b border-success/20">
                <p className="text-xs font-bold uppercase tracking-widest text-success">
                  Done ✓ ({done.length})
                </p>
              </div>
              <div className="divide-y divide-success/10">
                {done.map((item) => (
                  <button
                    key={item.menuItemId}
                    onClick={() => toggle(item.menuItemId)}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <span className="shrink-0 w-12 h-12 rounded-2xl bg-success/20 text-success text-xl font-black flex items-center justify-center line-through">
                      {item.totalQuantity}
                    </span>
                    <p className="flex-1 text-sm font-medium text-text-secondary line-through">{item.menuItem}</p>
                    <CheckCircle2 size={20} className="shrink-0 text-success" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
