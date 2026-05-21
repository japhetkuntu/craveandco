'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString, formatCurrency, printPurchaseOrderInvoice } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Truck, Plus, X, Phone, Mail } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { IngredientCombobox } from '@/components/ui/ingredient-combobox';

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface PurchaseOrderItem {
  id: string;
  ingredientId: string;
  ingredient: { name: string };
  quantity: number;
  unitCost: number;
}

interface NewOrderItem {
  id: string;
  ingredientId: string;
  inputMode: 'quantity' | 'amount';
  quantity: string;
  amount: string;
  unitCost: string;
}

interface PurchaseOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  supplier: { name: string };
  items: PurchaseOrderItem[];
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentCost: number;
}

// Human-readable status context
const PO_STATUS_HELP: Record<string, string> = {
  DRAFT: 'Pending owner approval',
  RECEIVED: 'Approved — stock has been updated',
  CANCELLED: 'This order was cancelled',
};

const PO_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Pending Approval',
  RECEIVED: 'Approved',
  CANCELLED: 'Cancelled',
};

export default function OpsPurchasingPage() {
  const { token, user } = useAuth();
  const INGREDIENTS_LIMIT = 100;
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersLimit] = useState(10);
  const [suppliersPage, setSuppliersPage] = useState(0);
  const [suppliersLimit] = useState(10);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '' });
  const [newOrder, setNewOrder] = useState<{ supplierId: string; notes: string; items: NewOrderItem[] }>({
    supplierId: '',
    notes: '',
    items: [{ id: crypto.randomUUID(), ingredientId: '', inputMode: 'quantity', quantity: '', amount: '', unitCost: '' }],
  });

  const fetchIngredients = useCallback(async (search = '') => {
    if (!token) return;
    setIngredientsLoading(true);
    try {
      const data = await get(
        `/api/v1/inventory/ingredients${buildQueryString({ page: 0, limit: INGREDIENTS_LIMIT, search: search.trim() || undefined })}`,
        token,
      ) as Ingredient[];
      setIngredients(data);
    } finally {
      setIngredientsLoading(false);
    }
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const [o, s] = await Promise.all([
      get(`/api/v1/purchase-orders${buildQueryString({ page: ordersPage, limit: ordersLimit })}`, token),
      get(`/api/v1/suppliers${buildQueryString({ page: suppliersPage, limit: suppliersLimit })}`, token),
    ]);
    setOrders(o);
    setSuppliers(s);
    setLoading(false);
  }, [token, ordersPage, ordersLimit, suppliersPage, suppliersLimit]);

  useEffect(() => { loadData().catch(console.error); }, [loadData]);

  useEffect(() => {
    if (!showCreateOrder) return;
    fetchIngredients().catch(console.error);
  }, [showCreateOrder, fetchIngredients]);

  const handleApprove = async (po: PurchaseOrder) => {
    if (!token) return;
    setApprovingId(po.id);
    try {
      await post(`/api/v1/purchase-orders/${po.id}/approve`, {}, token);
      await loadData();
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handlePrintInvoice = (po: PurchaseOrder) => {
    printPurchaseOrderInvoice(po);
  };

  const addOrderItem = () => {
    const newItem: NewOrderItem = { id: crypto.randomUUID(), ingredientId: '', inputMode: 'quantity', quantity: '', amount: '', unitCost: '' };
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateOrderItem = (index: number, key: keyof NewOrderItem, value: string) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => idx === index ? { ...item, [key]: value } : item),
    }));
  };

  const removeOrderItem = (index: number) => {
    if (newOrder.items.length === 1) return; // keep at least one
    setNewOrder((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreatingSupplier(true);
    try {
      await post('/api/v1/suppliers', newSupplier, token);
      setShowCreateSupplier(false);
      setNewSupplier({ name: '', phone: '', email: '' });
      await loadData();
    } catch (err) { console.error(err); }
    finally { setCreatingSupplier(false); }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newOrder.supplierId) return;
    setCreatingOrder(true);
    try {
      await post('/api/v1/purchase-orders', {
        branchId: user?.branchId,
        supplierId: newOrder.supplierId,
        notes: newOrder.notes,
        items: newOrder.items
          .filter((item) => {
            if (!item.ingredientId || !item.unitCost) return false;
            return item.inputMode === 'amount' ? !!item.amount : !!item.quantity;
          })
          .map((item) => ({
            ingredientId: item.ingredientId,
            quantity: item.inputMode === 'amount'
              ? Number(item.amount) / Number(item.unitCost)
              : Number(item.quantity),
            unitCost: Number(item.unitCost),
          })),
      }, token);
      setShowCreateOrder(false);
      const resetItems: NewOrderItem[] = [{ id: crypto.randomUUID(), ingredientId: '', inputMode: 'quantity', quantity: '', amount: '', unitCost: '' }];
      setNewOrder({ supplierId: '', notes: '', items: resetItems });
      await loadData();
    } catch (err) { console.error(err); }
    finally { setCreatingOrder(false); }
  };

  const orderTotal = newOrder.items.reduce((sum, item) => {
    if (item.inputMode === 'amount') return sum + (Number(item.amount) || 0);
    return sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
  }, 0);

  const pendingOrders = orders.filter((o) => o.status === 'DRAFT');

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Truck className="text-gold" /> Purchasing
          </h1>
          {pendingOrders.length > 0 ? (
            <p className="text-sm text-warning font-medium mt-1">
              {pendingOrders.length} order{pendingOrders.length > 1 ? 's' : ''} awaiting approval
            </p>
          ) : (
            <p className="text-sm text-text-secondary mt-1">Manage suppliers and stock orders</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="secondary" size="sm" onClick={() => setShowCreateSupplier(true)}>
            Add Supplier
          </Button>
          <Button size="sm" onClick={() => setShowCreateOrder(true)}>
            <Plus size={15} /> New Order
          </Button>
        </div>
      </div>

      {/* Purchase Orders */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle"><p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Purchase Orders</p></div>
        <div className="p-4">
          {orders.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-secondary">No purchase orders yet</p>
              <button
                onClick={() => setShowCreateOrder(true)}
                className="mt-3 text-sm text-gold font-semibold hover:underline"
              >
                + Create your first order
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((po) => (
                  <div key={po.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={po.status} label={PO_STATUS_LABEL[po.status]} />
                        <span className="text-sm font-semibold text-text-primary">{po.supplier?.name}</span>
                      </div>
                      <span className="text-sm font-bold text-text-primary">{formatCurrency(po.totalAmount)}</span>
                    </div>

                    {/* Status helper */}
                    <p className="text-xs text-text-secondary">{PO_STATUS_HELP[po.status] ?? po.status}</p>

                    {/* Items */}
                    {po.items?.length > 0 && (
                      <ul className="space-y-0.5">
                        {po.items.map((item, i) => (
                          <li key={i} className="text-xs text-text-secondary">
                            {item.ingredient?.name}: {Number(item.quantity).toFixed(2)} × {formatCurrency(item.unitCost)}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                      <span className="text-xs text-text-tertiary">
                        {new Date(po.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="secondary" onClick={() => handlePrintInvoice(po)}>
                          Print Invoice
                        </Button>
                        {po.status === 'DRAFT' && user?.role === 'OWNER' && (
                          <Button size="sm" loading={approvingId === po.id} onClick={() => handleApprove(po)}>
                            Approve
                          </Button>
                        )}
                        {po.status === 'DRAFT' && user?.role !== 'OWNER' && (
                          <span className="text-xs text-text-tertiary italic">Awaiting owner approval</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <PaginationControls
                  page={ordersPage}
                  limit={ordersLimit}
                  onPageChange={setOrdersPage}
                  onLimitChange={() => {}}
                  hasMore={orders.length === ordersLimit}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Suppliers */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Suppliers</p>
            <button onClick={() => setShowCreateSupplier(true)} className="text-sm text-gold font-semibold hover:underline flex items-center gap-1">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        <div className="p-4">
          {suppliers.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">No suppliers added yet</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {suppliers.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                  <p className="text-sm font-semibold text-text-primary">{s.name}</p>
                  {s.phone && (
                    <p className="text-xs text-text-secondary mt-1 flex items-center gap-1.5">
                      <Phone size={11} /> {s.phone}
                    </p>
                  )}
                  {s.email && (
                    <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                      <Mail size={11} /> {s.email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3">
            <PaginationControls
              page={suppliersPage}
              limit={suppliersLimit}
              onPageChange={setSuppliersPage}
              onLimitChange={() => {}}
              hasMore={suppliers.length === suppliersLimit}
            />
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showCreateSupplier && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Add a Supplier</h2>
                <p className="text-sm text-text-secondary mt-1">Save a supplier to use in purchase orders.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowCreateSupplier(false)}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form id="new-supplier-form" className="space-y-4" onSubmit={handleCreateSupplier}>
                <Input
                  label="Supplier name"
                  placeholder="e.g. Fresh Farms Ltd"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
                <Input
                  label="Phone number"
                  placeholder="e.g. 0244 123 456"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                />
                <Input
                  label="Email address (optional)"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCreateSupplier(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" loading={creatingSupplier} onClick={handleCreateSupplier}>Save Supplier</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Create Purchase Order</h2>
                <p className="text-sm text-text-secondary mt-1">Order ingredients from a supplier.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowCreateOrder(false)}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form id="new-order-form" className="space-y-5" onSubmit={handleCreateOrder}>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Which supplier?</label>
                  <select
                    value={newOrder.supplierId}
                    onChange={(e) => setNewOrder({ ...newOrder, supplierId: e.target.value })}
                    className="w-full h-12 px-4 rounded-2xl border border-border-default bg-surface-input text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    required
                  >
                    <option value="">Choose a supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">What are you ordering?</label>
                  {ingredientsLoading && (
                    <p className="mb-2 text-xs text-text-tertiary">Loading ingredients...</p>
                  )}
                  <div className="space-y-3">
                    {newOrder.items.map((item, index) => (
                      <div key={item.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-secondary">Item {index + 1}</span>
                          {newOrder.items.length > 1 && (
                            <button type="button" onClick={() => removeOrderItem(index)} className="text-text-tertiary hover:text-error transition-colors">
                              <X size={15} />
                            </button>
                          )}
                        </div>
                        <IngredientCombobox
                          ingredients={ingredients}
                          value={item.ingredientId}
                          onChange={(selectedId) => {
                            const sel = ingredients.find((ing) => ing.id === selectedId);
                            updateOrderItem(index, 'ingredientId', selectedId);
                            if (sel) updateOrderItem(index, 'unitCost', String(sel.currentCost));
                            else updateOrderItem(index, 'unitCost', '');
                          }}
                          onSearch={(q) => fetchIngredients(q).catch(console.error)}
                          loading={ingredientsLoading}
                          placeholder="Search ingredients…"
                          required
                        />
                        {/* Input mode toggle */}
                        <div className="flex items-center gap-1 rounded-2xl bg-surface-elevated p-1 text-xs font-semibold w-fit">
                          <button
                            type="button"
                            onClick={() => updateOrderItem(index, 'inputMode', 'quantity')}
                            className={`px-3 py-1.5 rounded-xl transition-colors ${item.inputMode === 'quantity' ? 'bg-white text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                          >
                            By quantity
                          </button>
                          <button
                            type="button"
                            onClick={() => updateOrderItem(index, 'inputMode', 'amount')}
                            className={`px-3 py-1.5 rounded-xl transition-colors ${item.inputMode === 'amount' ? 'bg-white text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                          >
                            By amount
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {item.inputMode === 'quantity' ? (
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Quantity</label>
                              <input
                                type="number"
                                placeholder="e.g. 10"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                                step="0.01"
                                className="w-full h-12 px-4 rounded-2xl border border-border-default bg-surface-input text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Amount spent (GH₵)</label>
                              <input
                                type="number"
                                placeholder="e.g. 50.00"
                                value={item.amount}
                                onChange={(e) => updateOrderItem(index, 'amount', e.target.value)}
                                step="0.01"
                                className="w-full h-12 px-4 rounded-2xl border border-border-default bg-surface-input text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                                required
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Cost per unit (GH₵)</label>
                            <input
                              type="number"
                              value={item.unitCost}
                              readOnly
                              tabIndex={-1}
                              className="w-full h-12 px-4 rounded-2xl border border-border-subtle bg-surface-elevated text-sm text-text-secondary outline-none cursor-not-allowed"
                              placeholder="Auto-filled from ingredient"
                            />
                          </div>
                        </div>
                        {item.inputMode === 'amount' && item.amount && item.unitCost && Number(item.unitCost) > 0 && (
                          <p className="text-xs text-text-tertiary">
                            Computed qty: <span className="font-semibold text-text-secondary">{(Number(item.amount) / Number(item.unitCost)).toFixed(2)}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="mt-3 text-sm text-[var(--color-gold)] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add another item
                  </button>
                </div>

                <Input
                  label="Notes (optional)"
                  placeholder="e.g. Deliver before 8am"
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                />

                {orderTotal > 0 && (
                  <div className="rounded-2xl bg-surface-elevated border border-border-subtle p-4 flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Estimated total</span>
                    <span className="text-base font-bold text-text-primary">{formatCurrency(orderTotal)}</span>
                  </div>
                )}
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCreateOrder(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" loading={creatingOrder} disabled={!newOrder.supplierId} onClick={handleCreateOrder}>Save Order</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
