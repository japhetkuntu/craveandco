'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Star, Plus, Trash2, TrendingUp } from 'lucide-react';

interface SpecialOrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
}

interface SpecialOrder {
  id: string;
  customerName?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
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
  costPrice: string;
  sellPrice: string;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function calcMargin(items: SpecialOrderItem[]) {
  const revenue = items.reduce((s, i) => s + Number(i.sellPrice) * Number(i.quantity), 0);
  const cost = items.reduce((s, i) => s + Number(i.costPrice) * Number(i.quantity), 0);
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return { revenue, cost, profit, margin };
}

function emptyItem(): NewItem {
  return { id: crypto.randomUUID(), name: '', description: '', quantity: '1', costPrice: '', sellPrice: '' };
}

export default function SpecialOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<SpecialOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrder, setNewOrder] = useState({ customerName: '', notes: '' });
  const [newItems, setNewItems] = useState<NewItem[]>([emptyItem()]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await get('/api/v1/special-orders', token) as SpecialOrder[];
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
      await post('/api/v1/special-orders', {
        customerName: newOrder.customerName || undefined,
        notes: newOrder.notes || undefined,
        items: newItems
          .filter((i) => i.name && i.quantity && i.costPrice && i.sellPrice)
          .map((i) => ({
            name: i.name,
            description: i.description || undefined,
            quantity: Number(i.quantity),
            costPrice: Number(i.costPrice),
            sellPrice: Number(i.sellPrice),
          })),
      }, token);
      setShowCreate(false);
      setNewOrder({ customerName: '', notes: '' });
      setNewItems([emptyItem()]);
      await loadOrders();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleStatusChange = async (order: SpecialOrder, status: 'COMPLETED' | 'CANCELLED') => {
    if (!token) return;
    setUpdatingId(order.id);
    try {
      await patch(`/api/v1/special-orders/${order.id}/status`, { status }, token);
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status } : o));
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  };

  const updateItem = (idx: number, key: keyof NewItem, value: string) => {
    setNewItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  };

  const removeItem = (idx: number) => {
    if (newItems.length === 1) return;
    setNewItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Preview totals for the create form
  const previewItems = newItems
    .filter((i) => i.name && i.quantity && i.costPrice && i.sellPrice)
    .map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      costPrice: Number(i.costPrice),
      sellPrice: Number(i.sellPrice),
    }));
  const preview = calcMargin(previewItems as any);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Star className="text-gold" /> Special Orders
          </h1>
          <p className="text-sm text-text-secondary mt-1">Custom orders outside the regular menu</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Special Order
        </Button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4" style={{ height: 'var(--viewport-height, 100dvh)' }}>
          <div className="w-full max-w-2xl rounded-[32px] bg-surface-default border border-border-default p-6 space-y-5 my-4">
            <h2 className="text-lg font-bold text-text-primary">New Special Order</h2>
            <form onSubmit={handleCreate} className="space-y-5">
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
                  <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Line Items</p>
                  <button type="button" onClick={() => setNewItems((p) => [...p, emptyItem()])} className="text-xs text-gold font-semibold hover:underline flex items-center gap-1">
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
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-text-tertiary">Qty</label>
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
                      <div className="space-y-1">
                        <label className="text-xs text-text-tertiary">Cost Price (GHS)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.costPrice}
                          onChange={(e) => updateItem(idx, 'costPrice', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-tertiary">Sell Price (GHS)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.sellPrice}
                          onChange={(e) => updateItem(idx, 'sellPrice', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {item.costPrice && item.sellPrice && item.quantity && (
                      <p className="text-xs text-text-tertiary">
                        Line total: <span className="font-semibold text-text-primary">{formatCurrency(Number(item.sellPrice) * Number(item.quantity))}</span>
                        {' '}&nbsp;·&nbsp; Profit: <span className={`font-semibold ${Number(item.sellPrice) >= Number(item.costPrice) ? 'text-success' : 'text-error'}`}>
                          {formatCurrency((Number(item.sellPrice) - Number(item.costPrice)) * Number(item.quantity))}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary preview */}
              {previewItems.length > 0 && (
                <div className="rounded-2xl bg-surface-elevated border border-border-subtle p-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-text-tertiary">Revenue</p>
                    <p className="font-bold text-text-primary">{formatCurrency(preview.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Cost</p>
                    <p className="font-bold text-text-primary">{formatCurrency(preview.cost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Gross Profit</p>
                    <p className={`font-bold ${preview.profit >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatCurrency(preview.profit)} <span className="font-normal text-xs">({preview.margin.toFixed(1)}%)</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating || newItems.filter((i) => i.name).length === 0}>
                  {creating ? 'Creating…' : 'Create Order'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">All Special Orders</p>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Star size={32} className="mx-auto text-text-tertiary opacity-40" />
            <p className="text-sm text-text-secondary">No special orders yet</p>
            <button onClick={() => setShowCreate(true)} className="text-sm text-gold font-semibold hover:underline">
              + Create your first special order
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {orders.map((order) => {
              const { revenue, cost, profit, margin } = calcMargin(order.items);
              const isUpdating = updatingId === order.id;
              return (
                <div key={order.id} className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={order.status} label={STATUS_LABEL[order.status]} />
                        <span className="text-sm font-semibold text-text-primary">
                          {order.customerName || 'Walk-in / Unspecified'}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {order.user && ` · Created by ${order.user.name}`}
                      </p>
                      {order.notes && <p className="text-xs text-text-secondary mt-0.5 italic">{order.notes}</p>}
                    </div>
                    {/* Profit summary */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">{formatCurrency(revenue)}</p>
                      <p className={`text-xs font-semibold ${profit >= 0 ? 'text-success' : 'text-error'}`}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({margin.toFixed(1)}%)
                      </p>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="rounded-2xl bg-surface-elevated border border-border-subtle overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border-subtle text-text-tertiary">
                          <th className="px-3 py-2 text-left font-medium">Item</th>
                          <th className="px-3 py-2 text-right font-medium">Qty</th>
                          <th className="px-3 py-2 text-right font-medium">Cost</th>
                          <th className="px-3 py-2 text-right font-medium">Sell</th>
                          <th className="px-3 py-2 text-right font-medium">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => {
                          const itemRevenue = Number(item.sellPrice) * Number(item.quantity);
                          const itemCost = Number(item.costPrice) * Number(item.quantity);
                          const itemProfit = itemRevenue - itemCost;
                          const itemMargin = itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0;
                          return (
                            <tr key={item.id} className="border-b border-border-subtle last:border-0">
                              <td className="px-3 py-2 font-medium text-text-primary">
                                {item.name}
                                {item.description && <span className="block text-text-tertiary font-normal">{item.description}</span>}
                              </td>
                              <td className="px-3 py-2 text-right text-text-secondary">{Number(item.quantity)}</td>
                              <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(Number(item.costPrice))}</td>
                              <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(Number(item.sellPrice))}</td>
                              <td className={`px-3 py-2 text-right font-semibold ${itemMargin >= 0 ? 'text-success' : 'text-error'}`}>
                                {itemMargin.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-default border-t border-border-default">
                          <td colSpan={2} className="px-3 py-2 text-xs font-bold text-text-tertiary uppercase tracking-wide">Totals</td>
                          <td className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">{formatCurrency(cost)}</td>
                          <td className="px-3 py-2 text-right text-xs font-semibold text-text-primary">{formatCurrency(revenue)}</td>
                          <td className={`px-3 py-2 text-right text-xs font-bold ${profit >= 0 ? 'text-success' : 'text-error'}`}>
                            <TrendingUp size={12} className="inline mr-1" />
                            {formatCurrency(profit)} · {margin.toFixed(1)}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Actions */}
                  {order.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order, 'CANCELLED')}
                      >
                        Cancel Order
                      </Button>
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order, 'COMPLETED')}
                      >
                        {isUpdating ? 'Updating…' : 'Mark Completed'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
