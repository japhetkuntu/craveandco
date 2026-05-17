'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Star, Plus, Trash2, TrendingUp, ClipboardCheck, XCircle } from 'lucide-react';

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
  costPrice: string;
  sellPrice: string;
}

// Pricing state for reviewing a draft
interface PriceEntry {
  id: string;
  name: string;
  quantity: number;
  costPrice: string;
  sellPrice: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Awaiting Review',
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

  // Review / pricing modal state
  const [reviewOrder, setReviewOrder] = useState<SpecialOrder | null>(null);
  const [priceEntries, setPriceEntries] = useState<PriceEntry[]>([]);
  const [reviewSaving, setReviewSaving] = useState(false);

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

  const openReview = (order: SpecialOrder) => {
    setReviewOrder(order);
    setPriceEntries(
      order.items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: Number(i.quantity),
        costPrice: Number(i.costPrice) > 0 ? String(i.costPrice) : '',
        sellPrice: Number(i.sellPrice) > 0 ? String(i.sellPrice) : '',
      })),
    );
  };

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

  const handleSavePricesAndApprove = async () => {
    if (!token || !reviewOrder) return;
    setReviewSaving(true);
    try {
      // 1. Save prices
      await patch(`/api/v1/special-orders/${reviewOrder.id}/prices`, {
        items: priceEntries.map((e) => ({
          id: e.id,
          costPrice: Number(e.costPrice) || 0,
          sellPrice: Number(e.sellPrice) || 0,
        })),
      }, token);
      // 2. Approve (DRAFT → PENDING)
      await patch(`/api/v1/special-orders/${reviewOrder.id}/approve`, {}, token);
      setReviewOrder(null);
      await loadOrders();
    } catch (err) { console.error(err); }
    finally { setReviewSaving(false); }
  };

  const handleRejectDraft = async (orderId: string) => {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      await patch(`/api/v1/special-orders/${orderId}/status`, { status: 'CANCELLED' }, token);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
      if (reviewOrder?.id === orderId) setReviewOrder(null);
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
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

  const previewItems = newItems
    .filter((i) => i.name && i.quantity && i.costPrice && i.sellPrice)
    .map((i) => ({ ...i, quantity: Number(i.quantity), costPrice: Number(i.costPrice), sellPrice: Number(i.sellPrice) }));
  const preview = calcMargin(previewItems as any);

  const previewReview = priceEntries
    .filter((e) => e.sellPrice && e.costPrice)
    .map((e) => ({ sellPrice: Number(e.sellPrice), costPrice: Number(e.costPrice), quantity: e.quantity }));
  const reviewProfit = previewReview.reduce((s, i) => s + (i.sellPrice - i.costPrice) * i.quantity, 0);
  const reviewRevenue = previewReview.reduce((s, i) => s + i.sellPrice * i.quantity, 0);
  const reviewMargin = reviewRevenue > 0 ? (reviewProfit / reviewRevenue) * 100 : 0;
  const canApprove = priceEntries.every((e) => Number(e.sellPrice) > 0);

  const drafts = orders.filter((o) => o.status === 'DRAFT');

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Star className="text-gold" /> Special Orders
          </h1>
          <p className="text-sm text-text-secondary mt-1">Custom orders outside the regular menu</p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Special Order
        </Button>
      </div>

      {/* Draft review banner */}
      {drafts.length > 0 && (
        <div className="rounded-2xl bg-warning-muted border border-warning/30 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ClipboardCheck size={18} className="text-warning shrink-0" />
            <p className="text-sm text-text-primary font-semibold">
              {drafts.length} order{drafts.length > 1 ? 's' : ''} awaiting your review
            </p>
          </div>
          <p className="text-xs text-text-secondary">Click &quot;Review &amp; Price&quot; on any draft below to add pricing and approve.</p>
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
            <div className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border-subtle bg-white px-4 sm:px-6 py-4 sm:py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">New Special Order</h2>
                <p className="text-sm text-text-secondary mt-1">Fill in details and pricing, then save.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
              <form id="create-form" onSubmit={handleCreate} className="space-y-5">
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
                        <Input placeholder="Item name *" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} required />
                        <Input placeholder="Description (optional)" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-text-tertiary">Qty</label>
                          <Input type="number" min="0.001" step="0.001" placeholder="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-tertiary">Cost (GHS)</label>
                          <Input type="number" min="0" step="0.01" placeholder="0.00" value={item.costPrice} onChange={(e) => updateItem(idx, 'costPrice', e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-tertiary">Sell (GHS)</label>
                          <Input type="number" min="0" step="0.01" placeholder="0.00" value={item.sellPrice} onChange={(e) => updateItem(idx, 'sellPrice', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {previewItems.length > 0 && (
                  <div className="rounded-2xl bg-surface-elevated border border-border-subtle p-3 grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-xs text-text-tertiary">Revenue</p><p className="font-bold text-text-primary">{formatCurrency(preview.revenue)}</p></div>
                    <div><p className="text-xs text-text-tertiary">Cost</p><p className="font-bold text-text-primary">{formatCurrency(preview.cost)}</p></div>
                    <div><p className="text-xs text-text-tertiary">Gross Profit</p><p className={`font-bold ${preview.profit >= 0 ? 'text-success' : 'text-error'}`}>{formatCurrency(preview.profit)} <span className="font-normal text-xs">({preview.margin.toFixed(1)}%)</span></p></div>
                  </div>
                )}
              </form>
            </div>
            <div className="border-t border-border-subtle px-4 sm:px-6 py-3 sm:py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="flex-1" type="submit" form="create-form" loading={creating} disabled={creating || newItems.filter((i) => i.name).length === 0}>
                Create Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Pricing Modal */}
      {reviewOrder && (
        <div
          className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4"
          onClick={() => setReviewOrder(null)}
        >
          <div
            className="w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[92dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col sm:my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border-subtle bg-white px-4 sm:px-6 py-4 sm:py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Review Special Order</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {reviewOrder.customerName || 'Walk-in'} · Requested by {reviewOrder.user?.name ?? 'staff'}
                </p>
              </div>
              <Button variant="secondary" onClick={() => setReviewOrder(null)}>Close</Button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
              {reviewOrder.notes && (
                <div className="rounded-2xl bg-surface-input border border-border-subtle p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-1">Notes from Growth</p>
                  <p className="text-sm text-text-primary">{reviewOrder.notes}</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Set Prices for Each Item</p>
                <p className="text-xs text-text-secondary">All sell prices must be filled to approve.</p>
              </div>

              <div className="space-y-3">
                {priceEntries.map((entry, idx) => (
                  <div key={entry.id} className="rounded-2xl border border-border-default bg-surface-input p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-text-primary text-sm">{entry.name}</p>
                      <span className="text-xs text-text-tertiary">×{Number(entry.quantity)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Cost Price (GHS)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.costPrice}
                          onChange={(e) => setPriceEntries((p) => p.map((x, i) => i === idx ? { ...x, costPrice: e.target.value } : x))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Sell Price (GHS) *</label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.sellPrice}
                          onChange={(e) => setPriceEntries((p) => p.map((x, i) => i === idx ? { ...x, sellPrice: e.target.value } : x))}
                        />
                      </div>
                    </div>
                    {entry.sellPrice && entry.costPrice && (
                      <p className="text-xs text-text-tertiary">
                        Line total: <span className="font-semibold text-text-primary">{formatCurrency(Number(entry.sellPrice) * entry.quantity)}</span>
                        &nbsp;·&nbsp; Profit: <span className={`font-semibold ${Number(entry.sellPrice) >= Number(entry.costPrice) ? 'text-success' : 'text-error'}`}>
                          {formatCurrency((Number(entry.sellPrice) - Number(entry.costPrice)) * entry.quantity)}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Margin preview */}
              {reviewRevenue > 0 && (
                <div className="rounded-2xl bg-surface-elevated border border-border-default p-3 grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-xs text-text-tertiary">Revenue</p><p className="font-bold text-text-primary">{formatCurrency(reviewRevenue)}</p></div>
                  <div><p className="text-xs text-text-tertiary">Profit</p><p className={`font-bold ${reviewProfit >= 0 ? 'text-success' : 'text-error'}`}>{formatCurrency(reviewProfit)}</p></div>
                  <div><p className="text-xs text-text-tertiary">Margin</p><p className={`font-bold ${reviewMargin >= 30 ? 'text-success' : reviewMargin >= 10 ? 'text-warning' : 'text-error'}`}>{reviewMargin.toFixed(1)}%</p></div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle px-4 sm:px-6 py-3 sm:py-4 flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                disabled={reviewSaving || updatingId === reviewOrder.id}
                onClick={() => handleRejectDraft(reviewOrder.id)}
              >
                <XCircle size={15} /> Decline
              </Button>
              <Button
                className="flex-1"
                loading={reviewSaving}
                disabled={reviewSaving || !canApprove}
                onClick={handleSavePricesAndApprove}
              >
                <ClipboardCheck size={15} /> Save Prices & Approve
              </Button>
            </div>
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
              const isDraft = order.status === 'DRAFT';
              return (
                <div key={order.id} className={`p-4 space-y-3 ${isDraft ? 'bg-warning-muted/40' : ''}`}>
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
                        {order.user && ` · Requested by ${order.user.name}`}
                      </p>
                      {order.notes && <p className="text-xs text-text-secondary mt-0.5 italic">{order.notes}</p>}
                    </div>
                    {!isDraft && (
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-text-primary">{formatCurrency(revenue)}</p>
                        <p className={`text-xs font-semibold ${profit >= 0 ? 'text-success' : 'text-error'}`}>
                          {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({margin.toFixed(1)}%)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Line items */}
                  <div className="rounded-2xl bg-surface-elevated border border-border-default overflow-x-auto">
                    <table className="w-full min-w-[440px] text-xs">
                      <thead>
                        <tr className="border-b border-border-subtle text-text-tertiary">
                          <th className="px-3 py-2 text-left font-medium">Item</th>
                          <th className="px-3 py-2 text-right font-medium">Qty</th>
                          {!isDraft && <>
                            <th className="px-3 py-2 text-right font-medium">Cost</th>
                            <th className="px-3 py-2 text-right font-medium">Sell</th>
                            <th className="px-3 py-2 text-right font-medium">Margin</th>
                          </>}
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
                              {!isDraft && <>
                                <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(Number(item.costPrice))}</td>
                                <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(Number(item.sellPrice))}</td>
                                <td className={`px-3 py-2 text-right font-semibold ${itemMargin >= 0 ? 'text-success' : 'text-error'}`}>
                                  {itemMargin.toFixed(1)}%
                                </td>
                              </>}
                            </tr>
                          );
                        })}
                      </tbody>
                      {!isDraft && (
                        <tfoot>
                          <tr className="bg-surface-raised border-t border-border-default">
                            <td colSpan={2} className="px-3 py-2 text-xs font-bold text-text-tertiary uppercase tracking-wide">Totals</td>
                            <td className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">{formatCurrency(cost)}</td>
                            <td className="px-3 py-2 text-right text-xs font-semibold text-text-primary">{formatCurrency(revenue)}</td>
                            <td className={`px-3 py-2 text-right text-xs font-bold ${profit >= 0 ? 'text-success' : 'text-error'}`}>
                              <TrendingUp size={12} className="inline mr-1" />
                              {formatCurrency(profit)} · {margin.toFixed(1)}%
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Actions */}
                  {isDraft && (
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isUpdating}
                        onClick={() => handleRejectDraft(order.id)}
                      >
                        <XCircle size={14} /> Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openReview(order)}
                      >
                        <ClipboardCheck size={14} /> Review &amp; Price
                      </Button>
                    </div>
                  )}
                  {order.status === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                      <Button size="sm" variant="danger" disabled={isUpdating} onClick={() => handleStatusChange(order, 'CANCELLED')}>
                        Cancel Order
                      </Button>
                      <Button size="sm" disabled={isUpdating} onClick={() => handleStatusChange(order, 'COMPLETED')}>
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


