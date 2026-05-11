'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageSkeleton } from '@/components/ui/skeleton';

interface LowStockItem {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
  belowReorder?: boolean;
}

export default function KitchenStockPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;
    get(API_PATHS.inventory.lowStock, token)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const requestRestock = async (ingredientId: string, name: string) => {
    if (!token || requesting.has(ingredientId)) return;
    setRequesting((prev) => new Set(prev).add(ingredientId));
    try {
      await post(API_PATHS.kitchen.shortageRequest, { ingredientId, reason: `Low stock: ${name}` }, token);
      setRequested((prev) => new Set(prev).add(ingredientId));
      toast('success', 'Request sent', `Restock request sent for ${name}.`);
    } catch (err) {
      toast('error', 'Could not send request', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setRequesting((prev) => { const n = new Set(prev); n.delete(ingredientId); return n; });
    }
  };

  const requestAll = async () => {
    for (const item of items) {
      if (!requested.has(item.id)) await requestRestock(item.id, item.name);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Package className="text-[var(--color-gold)]" size={22} /> Stock Alerts
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Items running low — request restock below
          </p>
        </div>
        {items.length > 1 && (
          <Button size="sm" variant="secondary" onClick={requestAll}>
            <Send size={14} /> Request All
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center rounded-3xl border border-dashed border-border-default">
          <CheckCircle2 size={52} className="text-success opacity-40" />
          <p className="text-base font-semibold text-text-secondary">All stock levels are good!</p>
          <p className="text-sm text-text-tertiary">No restock needed right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isLow = item.belowReorder ?? item.onHand < item.reorderLevel;
            const pct = item.reorderLevel > 0
              ? Math.min(100, Math.round((item.onHand / item.reorderLevel) * 100))
              : 0;
            const done = requested.has(item.id);
            const loading = requesting.has(item.id);

            return (
              <div
                key={item.id}
                className={`rounded-3xl border-2 bg-surface-raised p-4 space-y-4 ${
                  isLow ? 'border-error/30' : 'border-warning/30'
                }`}
              >
                {/* Item info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isLow ? 'bg-error-muted text-error' : 'bg-warning-muted text-warning'
                    }`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-text-primary">{item.name}</p>
                      <p className="text-sm text-text-secondary mt-0.5">
                        <span className={`font-bold ${isLow ? 'text-error' : 'text-warning'}`}>
                          {item.onHand} {item.unit}
                        </span>
                        {' '}left · reorder at {item.reorderLevel} {item.unit}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stock level bar */}
                <div>
                  <div className="flex justify-between text-xs text-text-tertiary mb-1.5">
                    <span>Stock level</span>
                    <span>{pct}% of reorder level</span>
                  </div>
                  <div className="w-full h-3 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-error' : 'bg-warning'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Action */}
                {done ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-success-muted border border-success/20 px-4 py-3 text-success text-sm font-semibold">
                    <CheckCircle2 size={16} /> Request sent — manager notified
                  </div>
                ) : (
                  <Button
                    className="w-full h-12 text-sm"
                    onClick={() => requestRestock(item.id, item.name)}
                    loading={loading}
                  >
                    <Send size={16} /> Request Restock
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
