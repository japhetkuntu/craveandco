'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { KPICard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, Plus } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
  currentCost: number;
  belowReorder?: boolean;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentCost: number;
  reorderLevel: number;
}

interface StockResponse {
  items: StockItem[];
  totalCount: number;
  lowStockCount: number;
  pageLowStockCount: number;
}

export default function OpsInventoryPage() {
  const { token, user } = useAuth();
  const [stockData, setStockData] = useState<StockResponse | null>(null);
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryForm, setInventoryForm] = useState({ id: '', name: '', unit: '', currentCost: 0, reorderLevel: 0 });
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [stockPage, setStockPage] = useState(0);
  const [stockLimit, setStockLimit] = useState(10);
  const [movementPage, setMovementPage] = useState(0);
  const [movementLimit, setMovementLimit] = useState(10);
  const [lowStockPage, setLowStockPage] = useState(0);
  const [lowStockLimit, setLowStockLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ingredientId: '', quantity: '', type: 'PURCHASE_IN', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [s, ls, ing, mv] = await Promise.all([
        get(`/api/v1/inventory/stock${buildQueryString({ page: stockPage, limit: stockLimit })}`, token),
        get(`/api/v1/inventory/alerts/low-stock${buildQueryString({ page: lowStockPage, limit: lowStockLimit })}`, token),
        get('/api/v1/inventory/ingredients?limit=100', token).catch(() => []),
        get(`/api/v1/inventory/movements${buildQueryString({ page: movementPage, limit: movementLimit })}`, token),
      ]);
      const stockResponse = s as StockResponse;
      setStockData({
        ...stockResponse,
        items: stockResponse.items.map((item) => ({
          ...item,
          currentCost: Number(item.currentCost),
          reorderLevel: Number(item.reorderLevel),
        })),
      });
      setLowStock(ls);
      setIngredients(ing);
      setMovements(mv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, stockPage, stockLimit, lowStockPage, lowStockLimit, movementPage, movementLimit]);

  const startIngredientEdit = (item: StockItem) => {
    setInventoryForm({
      id: item.id,
      name: item.name,
      unit: item.unit,
      currentCost: item.currentCost,
      reorderLevel: item.reorderLevel,
    });
    setEditingIngredientId(item.id);
    setInventoryError('');
  };

  const resetInventoryForm = () => {
    setInventoryForm({ id: '', name: '', unit: '', currentCost: 0, reorderLevel: 0 });
    setEditingIngredientId(null);
    setInventoryError('');
  };

  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !inventoryForm.name.trim()) {
      setInventoryError('Name is required');
      return;
    }

    setInventorySaving(true);
    setInventoryError('');
    try {
      const payload = {
        name: inventoryForm.name.trim(),
        unit: inventoryForm.unit.trim() || 'unit',
        currentCost: Number(inventoryForm.currentCost) || 0,
        reorderLevel: Number(inventoryForm.reorderLevel) || 0,
      };
      if (editingIngredientId) {
        await patch(`/api/v1/inventory/ingredients/${editingIngredientId}`, payload, token);
      } else {
        await post('/api/v1/inventory/ingredients', payload, token);
      }
      setInventoryForm({ id: '', name: '', unit: '', currentCost: 0, reorderLevel: 0 });
      setEditingIngredientId(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      setInventoryError('Failed to save inventory item');
    } finally {
      setInventorySaving(false);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await post('/api/v1/inventory/movements', {
        ingredientId: formData.ingredientId,
        branchId: user!.branchId,
        quantity: parseFloat(formData.quantity),
        type: formData.type,
        reason: formData.reason,
      }, token);
      setShowForm(false);
      setFormData({ ingredientId: '', quantity: '', type: 'PURCHASE_IN', reason: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  const stockItems = stockData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Package className="text-gold" /> Inventory
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Movement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingIngredientId ? 'Edit Inventory Item' : 'Add Inventory Item'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" onSubmit={handleInventorySubmit}>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Name</span>
              <input
                type="text"
                value={inventoryForm.name}
                onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Unit</span>
              <input
                type="text"
                value={inventoryForm.unit}
                onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Current Cost</span>
              <input
                type="number"
                value={inventoryForm.currentCost}
                onChange={(e) => setInventoryForm({ ...inventoryForm, currentCost: e.target.value === '' ? 0 : Number(e.target.value) })}
                className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                min={0}
                step={0.01}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Reorder Level</span>
              <input
                type="number"
                value={inventoryForm.reorderLevel}
                onChange={(e) => setInventoryForm({ ...inventoryForm, reorderLevel: e.target.value === '' ? 0 : Number(e.target.value) })}
                className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                min={0}
                step={0.01}
              />
            </label>
            <div className="md:col-span-4 flex flex-wrap items-center gap-3">
              <Button type="submit" loading={inventorySaving}>
                {editingIngredientId ? 'Update Item' : 'Add Item'}
              </Button>
              {editingIngredientId && (
                <Button type="button" variant="secondary" onClick={resetInventoryForm}>
                  Cancel
                </Button>
              )}
              {inventoryError && <p className="text-sm text-error">{inventoryError}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <KPICard title="Total Items" value={stockData?.totalCount || 0} icon={<Package size={20} />} />
        <KPICard
          title="Low Stock"
          value={stockData?.lowStockCount || 0}
          icon={<AlertTriangle size={20} />}
          severity={(stockData?.lowStockCount || 0) > 0 ? 'critical' : 'healthy'}
        />
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleMovement} className="space-y-3">
              <select
                value={formData.ingredientId}
                onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm bg-surface-raised focus:ring-2 focus:ring-gold"
                required
              >
                <option value="">Select ingredient...</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  step="0.01"
                  className="px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold"
                  required
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold"
                >
                  <option value="PURCHASE_IN">Purchase In</option>
                  <option value="WASTE">Waste</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="USAGE">Usage</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Reason (optional)"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold"
              />
              <Button type="submit" loading={submitting} className="w-full">Record Movement</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>All Stock</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-text-secondary">
                  <th className="py-2 pr-4">Ingredient</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Unit</th>
                  <th className="py-2 pr-4">Cost</th>
                  <th className="py-2 pr-4">Reorder</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item, index) => {
                  const isLow = item.belowReorder ?? item.onHand < item.reorderLevel;
                  return (
                    <tr key={`${item.id}-${index}`} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-text-primary">{item.name}</td>
                      <td className="py-2 pr-4">{item.onHand}</td>
                      <td className="py-2 pr-4 text-text-secondary">{item.unit}</td>
                      <td className="py-2 pr-4 text-text-secondary">{item.currentCost.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-text-secondary">{item.reorderLevel}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isLow ? 'bg-error-muted text-error' : 'bg-success-muted text-success'}`}>
                          {isLow ? 'Low' : 'OK'}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <Button size="sm" variant="ghost" onClick={() => startIngredientEdit(item)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
        <div className="px-4 pb-4">
          <PaginationControls
            page={stockPage}
            limit={stockLimit}
            onPageChange={setStockPage}
            onLimitChange={(value) => { setStockLimit(value); setStockPage(0); }}
            hasMore={stockItems.length === stockLimit}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No recent inventory adjustments.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-text-secondary">
                    <th className="py-2 pr-4">Ingredient</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Quantity</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-text-primary">{movement.ingredient?.name}</td>
                      <td className="py-2 pr-4 text-text-secondary">{movement.type}</td>
                      <td className="py-2 pr-4">{movement.quantity}</td>
                      <td className="py-2 pr-4 text-text-secondary">{movement.reason || '—'}</td>
                      <td className="py-2 text-text-secondary">{new Date(movement.createdAt).toLocaleString('en-GH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <div className="px-4 pb-4">
          <PaginationControls
            page={movementPage}
            limit={movementLimit}
            onPageChange={setMovementPage}
            onLimitChange={(value) => { setMovementLimit(value); setMovementPage(0); }}
            hasMore={movements.length === movementLimit}
          />
        </div>
      </Card>
    </div>
  );
}
