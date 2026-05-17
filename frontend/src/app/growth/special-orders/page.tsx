'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Star, Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';

interface SpecialOrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
}

interface SpecialOrder {
  id: string;
  customerName?: string;
  status: 'DRAFT' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  user?: { name: string };
  items: SpecialOrderItem[];
}

interface NewItem {
  id: string;
  name: string;
  description: string;
  quantity: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Pending Review',
  PENDING: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Declined',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  DRAFT: <Clock size={14} className="text-warning" />,
  PENDING: <Clock size={14} className="text-info" />,
  COMPLETED: <CheckCircle size={14} className="text-success" />,
  CANCELLED: <XCircle size={14} className="text-error" />,
};

function emptyItem(): NewItem {
  return { id: crypto.randomUUID(), name: '', description: '', quantity: '1' };
}

export default function GrowthSpecialOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<SpecialOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrder, setNewOrder] = useState({ customerName: '', notes: '' });
  const [newItems, setNewItems] = useState<NewItem[]>([emptyItem()]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await get('/api/v1/special-orders/my', token) as SpecialOrder[];
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadOrders().catch(console.error); }, [loadOrders]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      await post('/api/v1/special-orders/draft', {
        customerName: newOrder.customerName || undefined,
        notes: newOrder.notes || undefined,
        items: newItems
          .filter((i) => i.name && i.quantity)
          .map((i) => ({
            name: i.name,
            description: i.description || undefined,
            quantity: Number(i.quantity),
          })),
      }, token);
      setShowCreate(false);
      setNewOrder({ customerName: '', notes: '' });
      setNewItems([emptyItem()]);
      await loadOrders();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const updateItem = (idx: number, key: keyof NewItem, value: string) => {
    setNewItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  };

  const removeItem = (idx: number) => {
    if (newItems.length === 1) return;
    setNewItems((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) return <PageSkeleton />;

  const drafts = orders.filter((o) => o.status === 'DRAFT');
  const others = orders.filter((o) => o.status !== 'DRAFT');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Star className="text-gold" /> Special Orders
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Request custom orders outside the regular menu. Operations will review and price them.
          </p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Request Order
        </Button>
      </div>

      {/* Pending review banner */}
      {drafts.length > 0 && (
        <div className="rounded-2xl bg-warning-muted border border-warning/30 px-4 py-3 flex items-center gap-3">
          <Clock size={18} className="text-warning shrink-0" />
          <p className="text-sm text-text-primary">
            <span className="font-semibold">{drafts.length} order{drafts.length > 1 ? 's' : ''} awaiting review</span>
            {' '}— Operations will add pricing and confirm soon.
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col sm:my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border-subtle bg-white px-4 sm:px-6 py-4 sm:py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">New Special Order Request</h2>
                <p className="text-sm text-text-secondary mt-1">List the items you need. Operations will review and confirm pricing.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Close</Button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
              <form id="draft-form" onSubmit={handleCreate} className="space-y-5">
                {/* Customer / notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Customer Name (optional)</label>
                    <Input
                      placeholder="e.g. Akosua Mensah"
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder((p) => ({ ...p, customerName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Notes (optional)</label>
                    <Input
                      placeholder="Any special instructions"
                      value={newOrder.notes}
                      onChange={(e) => setNewOrder((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Line items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Items Requested</p>
                    <button
                      type="button"
                      onClick={() => setNewItems((p) => [...p, emptyItem()])}
                      className="text-xs text-gold font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Item
                    </button>
                  </div>
                  {newItems.map((item, idx) => (
                    <div key={item.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-tertiary">Item {idx + 1}</span>
                        {newItems.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-text-tertiary hover:text-error">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Item name *"
                          value={item.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Description (optional)"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-40">
                        <div className="space-y-1">
                          <label className="text-xs text-text-tertiary">Quantity</label>
                          <Input
                            type="number"
                            min="0.001"
                            step="0.001"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle px-4 sm:px-6 py-3 sm:py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                className="flex-1"
                type="submit"
                form="draft-form"
                loading={creating}
                disabled={creating || newItems.filter((i) => i.name).length === 0}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Your Requests</p>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Star size={32} className="mx-auto text-text-tertiary opacity-40" />
            <p className="text-sm text-text-secondary">No special order requests yet</p>
            <button onClick={() => setShowCreate(true)} className="text-sm text-gold font-semibold hover:underline">
              + Submit your first request
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {[...drafts, ...others].map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={order.status} label={STATUS_LABEL[order.status]} />
                      <span className="text-sm font-semibold text-text-primary">
                        {order.customerName || 'Walk-in / Unspecified'}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {order.notes && <p className="text-xs text-text-secondary mt-0.5 italic">{order.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-tertiary">
                    {STATUS_ICON[order.status]}
                    <span>{STATUS_LABEL[order.status]}</span>
                  </div>
                </div>

                {/* Items (no prices) */}
                <div className="rounded-2xl bg-surface-elevated border border-border-default overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle text-text-tertiary">
                        <th className="px-3 py-2 text-left font-medium">Item</th>
                        <th className="px-3 py-2 text-right font-medium">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b border-border-subtle last:border-0">
                          <td className="px-3 py-2 font-medium text-text-primary">
                            {item.name}
                            {item.description && (
                              <span className="block text-text-tertiary font-normal">{item.description}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-text-secondary">{Number(item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
