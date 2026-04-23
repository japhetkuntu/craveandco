'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Truck, Plus } from 'lucide-react';
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

export default function OpsPurchasingPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersLimit, setOrdersLimit] = useState(10);
  const [suppliersPage, setSuppliersPage] = useState(0);
  const [suppliersLimit, setSuppliersLimit] = useState(10);
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

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      get(`/api/v1/purchase-orders${buildQueryString({ page: ordersPage, limit: ordersLimit })}`, token),
      get(`/api/v1/suppliers${buildQueryString({ page: suppliersPage, limit: suppliersLimit })}`, token),
      get('/api/v1/inventory/ingredients', token),
    ])
      .then(([o, s, ing]) => {
        setOrders(o);
        setSuppliers(s);
        setIngredients(ing);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, ordersPage, ordersLimit, suppliersPage, suppliersLimit]);

  const handleReceive = async (po: PurchaseOrder) => {
    if (!token) return;
    try {
      const body = {
        items: po.items.map((item) => ({
          purchaseOrderItemId: item.id,
          receivedQty: Number(item.quantity),
        })),
      };
      await post(`/api/v1/purchase-orders/${po.id}/receive`, body, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === po.id ? { ...o, status: 'RECEIVED' } : o)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendOrder = async (po: PurchaseOrder) => {
    if (!token) return;
    try {
      await patch(`/api/v1/purchase-orders/${po.id}/send`, {}, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === po.id ? { ...o, status: 'SENT' } : o)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const addOrderItem = () => {
    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), ingredientId: '', quantity: '', unitCost: '' }],
    }));
  };

  const updateOrderItem = (index: number, key: 'ingredientId' | 'quantity' | 'unitCost', value: string) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const removeOrderItem = (index: number) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreatingSupplier(true);
    try {
      await post('/api/v1/suppliers', newSupplier, token);
      setShowCreateSupplier(false);
      setNewSupplier({ name: '', phone: '', email: '' });
      const nextSuppliersPage = 0;
      setSuppliersPage(nextSuppliersPage);
      setLoading(true);
      const [o, s] = await Promise.all([
        get(`/api/v1/purchase-orders${buildQueryString({ page: ordersPage, limit: ordersLimit })}`, token),
        get(`/api/v1/suppliers${buildQueryString({ page: nextSuppliersPage, limit: suppliersLimit })}`, token),
      ]);
      setOrders(o);
      setSuppliers(s);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingSupplier(false);
      setLoading(false);
    }
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
      const nextOrdersPage = 0;
      setOrdersPage(nextOrdersPage);
      setLoading(true);
      const [o, s] = await Promise.all([
        get(`/api/v1/purchase-orders${buildQueryString({ page: nextOrdersPage, limit: ordersLimit })}`, token),
        get(`/api/v1/suppliers${buildQueryString({ page: suppliersPage, limit: suppliersLimit })}`, token),
      ]);
      setOrders(o);
      setSuppliers(s);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingOrder(false);
      setLoading(false);
    }
  };

  const orderTotal = newOrder.items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitCost = Number(item.unitCost) || 0;
    return sum + quantity * unitCost;
  }, 0);

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Truck className="text-gold" /> Purchasing
          </h1>
          <p className="text-sm text-text-secondary mt-1">Create suppliers, manage purchase orders, and keep procurement running smoothly.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setShowCreateSupplier(true)}>
            Add Supplier
          </Button>
          <Button onClick={() => setShowCreateOrder(true)}>
            <Plus size={16} /> New Purchase Order
          </Button>
        </div>
      </div>

      {/* Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({suppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No suppliers added</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {suppliers.map((s) => (
                <div key={s.id} className="rounded-3xl border border-border-default bg-surface-base p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text-primary">{s.name}</h3>
                    <span className="rounded-full bg-gold-muted px-2 py-1 text-xs font-medium text-gold">Supplier</span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{s.phone || 'No phone provided'}</p>
                  {s.email ? <p className="mt-1 text-sm text-text-secondary">{s.email}</p> : null}
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            page={suppliersPage}
            limit={suppliersLimit}
            onPageChange={setSuppliersPage}
            onLimitChange={(value) => { setSuppliersLimit(value); setSuppliersPage(0); }}
            hasMore={suppliers.length === suppliersLimit}
          />
        </CardContent>
      </Card>

      {/* Purchase Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No purchase orders</p>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((po) => (
                  <div
                  key={po.id}
                  className="p-4 bg-surface-base rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={po.status} />
                      <span className="text-sm font-medium text-text-primary">{po.supplier?.name}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                      {formatCurrency(po.totalAmount)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {po.items?.map((item, i) => (
                      <p key={i} className="text-xs text-text-secondary">
                        {item.ingredient?.name}: {item.quantity} @ {formatCurrency(item.unitCost)}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">
                      {new Date(po.createdAt).toLocaleDateString('en-GH')}
                    </span>
                    {po.status === 'DRAFT' && (
                      <Button size="sm" onClick={() => handleSendOrder(po)}>
                        Send Order
                      </Button>
                    )}
                    {po.status === 'SENT' && (
                      user?.role === 'OWNER' ? (
                        <Button size="sm" onClick={() => handleReceive(po)}>
                          Mark Received
                        </Button>
                      ) : (
                        <span className="text-xs text-text-secondary">
                          Waiting for owner receipt confirmation
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              page={ordersPage}
              limit={ordersLimit}
              onPageChange={setOrdersPage}
              onLimitChange={(value) => { setOrdersLimit(value); setOrdersPage(0); }}
              hasMore={orders.length === ordersLimit}
            />
          </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={showCreateSupplier}
        onClose={() => setShowCreateSupplier(false)}
        title="Add New Supplier"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateSupplier(false)}>Cancel</Button>
            <Button loading={creatingSupplier} onClick={handleCreateSupplier}>Save Supplier</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateSupplier}>
          <Input
            label="Supplier Name"
            required
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
          />
          <Input
            label="Phone"
            value={newSupplier.phone}
            onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={newSupplier.email}
            onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
          />
        </form>
      </Modal>

      <Modal
        open={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        title="Create Purchase Order"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateOrder(false)}>Cancel</Button>
            <Button loading={creatingOrder} onClick={handleCreateOrder}>Create Order</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateOrder}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary">Supplier</label>
              <select
                value={newOrder.supplierId}
                onChange={(e) => setNewOrder({ ...newOrder, supplierId: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-text-primary"
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Notes"
              value={newOrder.notes}
              onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            {newOrder.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto] items-end">
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Ingredient</label>
                  <select
                    value={item.ingredientId}
                    onChange={(e) => updateOrderItem(index, 'ingredientId', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-text-primary"
                    required
                  >
                    <option value="">Choose ingredient</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>{ingredient.name} ({ingredient.unit})</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Quantity"
                  type="number"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                  required
                />
                <Input
                  label="Unit cost"
                  type="number"
                  step="0.01"
                  value={item.unitCost}
                  onChange={(e) => updateOrderItem(index, 'unitCost', e.target.value)}
                  required
                />
                <Button variant="secondary" type="button" onClick={() => removeOrderItem(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="secondary" onClick={addOrderItem}>Add item</Button>
            <div className="text-right text-sm text-text-secondary">
              <div>Total estimate</div>
              <div className="text-lg font-semibold text-text-primary">{formatCurrency(orderTotal)}</div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
