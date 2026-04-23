'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination';
import { KPICard } from '@/components/ui/kpi-card';
import { Package, AlertTriangle } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface StockItem {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
  currentCost: number;
  belowReorder?: boolean;
}

interface StockResponse {
  items: StockItem[];
  totalCount: number;
  lowStockCount: number;
  pageLowStockCount: number;
}

export default function OwnerInventoryPage() {
  const { token } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [movementPage, setMovementPage] = useState(0);
  const [movementLimit, setMovementLimit] = useState(10);
  const [movements, setMovements] = useState<any[]>([]);
  const [movementAnalytics, setMovementAnalytics] = useState<{ totalMovements: number; typeCounts: Record<string, number>; typeQuantities: Record<string, number>; } | null>(null);
  const [inventoryForm, setInventoryForm] = useState({ id: '', name: '', unit: '', reorderLevel: 0, currentCost: 0 });
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryError, setInventoryError] = useState('');

  const totalOnHand = stock.reduce((sum, item) => sum + item.onHand, 0);
  const lowStockPercent = totalItems > 0 ? Math.round((lowStockCount / totalItems) * 100) : 0;

  const resetInventoryForm = () => {
    setInventoryForm({ id: '', name: '', unit: '', reorderLevel: 0, currentCost: 0 });
    setEditingIngredientId(null);
    setInventoryError('');
  };

  const startInventoryEdit = (item: StockItem) => {
    setInventoryForm({
      id: item.id,
      name: item.name,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      currentCost: item.currentCost,
    });
    setEditingIngredientId(item.id);
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

      resetInventoryForm();
      await loadStock();
    } catch (err: any) {
      setInventoryError(err?.message || 'Failed to save inventory item');
      console.error(err);
    } finally {
      setInventorySaving(false);
    }
  };

  const loadStock = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [stockResponse, lowStockItems, movementAnalyticsResponse, movementHistory] = await Promise.all([
        get(`/api/v1/inventory/stock${buildQueryString({ page, limit })}`, token),
        get('/api/v1/inventory/alerts/low-stock', token),
        get('/api/v1/inventory/movements/analytics', token),
        get(`/api/v1/inventory/movements${buildQueryString({ page: movementPage, limit: movementLimit })}`, token),
      ]);
      const response = stockResponse as StockResponse;
      const normalizedItems = response.items.map((item) => ({
        ...item,
        currentCost: Number(item.currentCost),
        reorderLevel: Number(item.reorderLevel),
      }));
      setStock(normalizedItems);
      setTotalItems(response.totalCount);
      setLowStockCount(response.lowStockCount);
      setLowStock(lowStockItems);
      setMovementAnalytics(movementAnalyticsResponse);
      setMovements(movementHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStock();
  }, [token, page, limit, movementPage, movementLimit]);

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <Package className="text-gold" /> Inventory
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Items" value={totalItems} icon={<Package size={20} />} />
        <KPICard title="Low Stock" value={lowStockCount} icon={<AlertTriangle size={20} />} severity={lowStockCount > 0 ? 'critical' : 'healthy'} />
        <KPICard title="Total Quantity" value={totalOnHand} icon={<Package size={20} />} />
        <KPICard title="Low Stock %" value={`${lowStockPercent}%`} icon={<AlertTriangle size={20} />} severity={lowStockPercent > 20 ? 'warning' : 'healthy'} />
      </div>

      {movementAnalytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Movements" value={movementAnalytics.totalMovements} icon={<Package size={20} />} />
          <KPICard title="Purchases" value={movementAnalytics.typeCounts.PURCHASE_IN || 0} icon={<Package size={20} />} />
          <KPICard title="Waste" value={movementAnalytics.typeCounts.WASTE || 0} icon={<AlertTriangle size={20} />} severity={(movementAnalytics.typeCounts.WASTE || 0) > 0 ? 'warning' : 'healthy'} />
          <KPICard title="Adjustments" value={movementAnalytics.typeCounts.ADJUSTMENT || 0} icon={<AlertTriangle size={20} />} severity={(movementAnalytics.typeCounts.ADJUSTMENT || 0) > 0 ? 'warning' : 'healthy'} />
        </div>
      )}

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

      {lowStock.length > 0 && (
        <Card className="border-border-default bg-error-muted">
          <CardHeader>
            <CardTitle className="text-error flex items-center gap-2">
              <AlertTriangle size={18} /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-surface-raised rounded-xl"
                >
                  <span className="font-medium text-text-primary">{item.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-error">
                      {item.onHand} {item.unit}
                    </span>
                    <span className="text-xs text-text-tertiary ml-2">
                      (reorder at {item.reorderLevel})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[280px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-text-secondary">
                  <th className="py-2 pr-4">Ingredient</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Unit</th>
                  <th className="py-2 pr-4">Cost</th>
                  <th className="py-2 pr-4">Reorder</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item, index) => {
                  const isLow = item.belowReorder ?? item.onHand < item.reorderLevel;
                  return (
                    <tr key={`${item.id}-${index}`} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-text-primary">{item.name}</td>
                      <td className="py-2 pr-4">{item.onHand}</td>
                      <td className="py-2 pr-4 text-text-secondary">{item.unit}</td>
                      <td className="py-2 pr-4 text-text-secondary">{item.currentCost.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-text-secondary">{item.reorderLevel}</td>
                      <td className="py-2 pr-4">
                        <Button size="sm" variant="ghost" onClick={() => startInventoryEdit(item)}>
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
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(0); }}
            hasMore={stock.length === limit}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-text-secondary">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Ingredient</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-text-secondary">{new Date(movement.createdAt).toLocaleDateString('en-GH')}</td>
                    <td className="py-2 pr-4 font-medium text-text-primary">{movement.ingredient?.name || 'Unknown'}</td>
                    <td className="py-2 pr-4 text-text-secondary">{movement.type.replace('_', ' ')}</td>
                    <td className="py-2 pr-4">{movement.quantity}</td>
                    <td className="py-2 pr-4 text-text-secondary">{movement.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <PaginationControls
              page={movementPage}
              limit={movementLimit}
              onPageChange={setMovementPage}
              onLimitChange={(value) => { setMovementLimit(value); setMovementPage(0); }}
              hasMore={movements.length === movementLimit}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
