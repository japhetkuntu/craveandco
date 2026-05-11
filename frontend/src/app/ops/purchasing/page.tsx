'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { buildQueryString, formatCurrency, printPurchaseOrderInvoice } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Truck, Plus, X, Phone, Mail } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

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
  quantity: string;
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
}

// Human-readable status context
const PO_STATUS_HELP: Record<string, string> = {
  DRAFT: 'Not sent yet — review and send when ready',
  SENT: 'Sent to supplier — waiting for delivery',
  RECEIVED: 'Delivery received and stock updated',
  CANCELLED: 'This order was cancelled',
};

export default function OpsPurchasingPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersLimit] = useState(10);
  const [suppliersPage, setSuppliersPage] = useState(0);
  const [suppliersLimit] = useState(10);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '' });
  const [newOrder, setNewOrder] = useState({
    supplierId: '',
    notes: '',
    items: [{ id: crypto.randomUUID(), ingredientId: '', quantity: '', unitCost: '' }],
  });

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    const [o, s, ing] = await Promise.all([
      get(`/api/v1/purchase-orders${buildQueryString({ page: ordersPage, limit: ordersLimit })}`, token),
      get(`/api/v1/suppliers${buildQueryString({ page: suppliersPage, limit: suppliersLimit })}`, token),
      get('/api/v1/inventory/ingredients', token),
    ]);
    setOrders(o);
    setSuppliers(s);
    setIngredients(ing);
    setLoading(false);
  };

  useEffect(() => { loadData().catch(console.error); }, [token, ordersPage, suppliersPage]);

  const handleReceive = async (po: PurchaseOrder) => {
    if (!token) return;
    await post(`/api/v1/purchase-orders/${po.id}/receive`, {
      items: po.items.map((item) => ({ purchaseOrderItemId: item.id, receivedQty: Number(item.quantity) })),
    }, token);
    setOrders((prev) => prev.map((o) => (o.id === po.id ? { ...o, status: 'RECEIVED' } : o)));
  };

  const handleSendOrder = async (po: PurchaseOrder) => {
    if (!token) return;
    await patch(`/api/v1/purchase-orders/${po.id}/send`, {}, token);
    setOrders((prev) => prev.map((o) => (o.id === po.id ? { ...o, status: 'SENT' } : o)));
  };

  const handlePrintInvoice = (po: PurchaseOrder) => {
    printPurchaseOrderInvoice(po);
  };

  const addOrderItem = () => {
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), ingredientId: '', quantity: '', unitCost: '' }],
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
          .filter((item) => item.ingredientId && item.quantity && item.unitCost)
          .map((item) => ({
            ingredientId: item.ingredientId,
            quantity: Number(item.quantity),
            unitCost: Number(item.unitCost),
          })),
      }, token);
      setShowCreateOrder(false);
      setNewOrder({ supplierId: '', notes: '', items: [{ id: crypto.randomUUID(), ingredientId: '', quantity: '', unitCost: '' }] });
      await loadData();
    } catch (err) { console.error(err); }
    finally { setCreatingOrder(false); }
  };

  const orderTotal = newOrder.items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
  }, 0);

  const pendingOrders = orders.filter((o) => o.status === 'DRAFT' || o.status === 'SENT');

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
              {pendingOrders.length} order{pendingOrders.length > 1 ? 's' : ''} in progress
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
                        <StatusBadge status={po.status} />
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
                            {item.ingredient?.name}: {item.quantity} × {formatCurrency(item.unitCost)}
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
                        {po.status === 'DRAFT' && (
                          <Button size="sm" onClick={() => handleSendOrder(po)}>
                            Send to Supplier
                          </Button>
                        )}
                        {po.status === 'SENT' && user?.role === 'OWNER' && (
                          <Button size="sm" onClick={() => handleReceive(po)}>
                            Mark as Received
                          </Button>
                        )}
                        {po.status === 'SENT' && user?.role !== 'OWNER' && (
                          <span className="text-xs text-text-tertiary italic">Awaiting owner confirmation</span>
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
      <Modal
        open={showCreateSupplier}
        onClose={() => setShowCreateSupplier(false)}
        title="Add a Supplier"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateSupplier(false)}>Cancel</Button>
            <Button loading={creatingSupplier} onClick={handleCreateSupplier}>Save Supplier</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateSupplier}>
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
      </Modal>

      {/* Create Purchase Order Modal */}
      <Modal
        open={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        title="Create Purchase Order"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateOrder(false)}>Cancel</Button>
            <Button loading={creatingOrder} disabled={!newOrder.supplierId} onClick={handleCreateOrder}>
              Save Order
            </Button>
          </>
        }
      >
        <form className="space-y-5" onSubmit={handleCreateOrder}>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Which supplier?</label>
            <select
              value={newOrder.supplierId}
              onChange={(e) => setNewOrder({ ...newOrder, supplierId: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
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
            <div className="space-y-3">
              {newOrder.items.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-border-subtle bg-surface-elevated p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">Item {index + 1}</span>
                    {newOrder.items.length > 1 && (
                      <button type="button" onClick={() => removeOrderItem(index)} className="text-text-tertiary hover:text-error transition-colors">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <select
                    value={item.ingredientId}
                    onChange={(e) => updateOrderItem(index, 'ingredientId', e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                    required
                  >
                    <option value="">Choose ingredient...</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Quantity</label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                        step="0.01"
                        className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Cost per unit (GH₵)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5.00"
                        value={item.unitCost}
                        onChange={(e) => updateOrderItem(index, 'unitCost', e.target.value)}
                        step="0.01"
                        className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOrderItem}
              className="mt-3 text-sm text-gold font-semibold hover:underline flex items-center gap-1"
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
            <div className="rounded-xl bg-surface-elevated border border-border-subtle p-3 flex justify-between items-center">
              <span className="text-sm text-text-secondary">Estimated total</span>
              <span className="text-base font-bold text-text-primary">{formatCurrency(orderTotal)}</span>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
