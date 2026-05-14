'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { buildQueryString, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PaginationControls } from '@/components/ui/pagination';
import { Package, AlertTriangle, Plus } from 'lucide-react';
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
  totalAssetValue?: number;
}

interface MovementEntry {
  id: string;
  createdAt: string;
  ingredient?: { name: string };
  type: string;
  quantity: number;
  reason?: string;
}

export default function OwnerInventoryPage() {
  const { token } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalAssetValue, setTotalAssetValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [lowStockPage, setLowStockPage] = useState(0);
  const [lowStockLimit] = useState(10);
  const [movementPage, setMovementPage] = useState(0);
  const [movementLimit, setMovementLimit] = useState(10);
  const [movements, setMovements] = useState<MovementEntry[]>([]);
  const [movementAnalytics, setMovementAnalytics] = useState<{ totalMovements: number; typeCounts: Record<string, number>; typeQuantities: Record<string, number>; } | null>(null);
  const [inventoryForm, setInventoryForm] = useState({ id: '', name: '', unit: '', reorderLevel: 0, currentCost: 0 });
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save inventory item';
      setInventoryError(message);
      console.error(err);
    } finally {
      setInventorySaving(false);
    }
  };

  const loadStock = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [stockResponse, lowStockItems, movementAnalyticsResponse, movementHistory] = await Promise.all([
        get(`/api/v1/inventory/stock${buildQueryString({ page, limit })}`, token),
        get(`/api/v1/inventory/alerts/low-stock${buildQueryString({ page: lowStockPage, limit: lowStockLimit })}`, token),
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
      setTotalAssetValue(response.totalAssetValue ?? 0);
      setLowStock(lowStockItems);
      setMovementAnalytics(movementAnalyticsResponse);
      setMovements(movementHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, lowStockPage, lowStockLimit, movementPage, movementLimit]);

  useEffect(() => {
    void loadStock();
  }, [loadStock]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Package className="text-[var(--color-gold)]" /> Inventory
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Track stock levels and manage ingredients</p>
        </div>
        <Button onClick={() => { resetInventoryForm(); setShowItemModal(true); }}>
          <Plus size={16} /> Add Item
        </Button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Package size={18} />, label: 'Total Items', value: totalItems, tone: undefined },
          { icon: <AlertTriangle size={18} />, label: 'Low Stock', value: lowStockCount, tone: lowStockCount > 0 ? 'red' as const : 'green' as const },
          { icon: <Package size={18} />, label: 'Inventory Worth', value: formatCurrency(totalAssetValue), tone: undefined },
          { icon: <Package size={18} />, label: 'Total Quantity', value: totalOnHand, tone: undefined },
          { icon: <AlertTriangle size={18} />, label: 'Low Stock %', value: `${lowStockPercent}%`, tone: lowStockPercent > 20 ? 'yellow' as const : undefined },
        ].map(({ icon, label, value, tone }) => {
          const bg = tone === 'green' ? 'bg-success-muted border-success/30' : tone === 'red' ? 'bg-error-muted border-error/30' : tone === 'yellow' ? 'bg-warning-muted border-warning/30' : 'bg-surface-raised border-border-subtle';
          const tv = tone === 'green' ? 'text-success' : tone === 'red' ? 'text-error' : tone === 'yellow' ? 'text-warning' : 'text-text-primary';
          return (
            <div key={label} className={`rounded-2xl border p-4 flex flex-col gap-2 ${bg}`}>
              <div className={`flex items-center gap-2 text-sm font-semibold ${tv}`}>{icon}<span>{label}</span></div>
              <p className={`text-3xl font-bold font-mono ${tv}`}>{value}</p>
            </div>
          );
        })}
      </div>

      {movementAnalytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Movements', value: movementAnalytics.totalMovements },
            { label: 'Purchases', value: movementAnalytics.typeCounts.PURCHASE_IN || 0 },
            { label: 'Waste', value: movementAnalytics.typeCounts.WASTE || 0 },
            { label: 'Adjustments', value: movementAnalytics.typeCounts.ADJUSTMENT || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-border-subtle bg-surface-raised p-3 flex flex-col gap-1">
              <p className="text-xs text-text-tertiary">{label}</p>
              <p className="text-2xl font-bold font-mono text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="rounded-3xl border border-error/30 bg-error-muted p-4 space-y-3">
          <p className="text-sm font-bold text-error flex items-center gap-2">
            <AlertTriangle size={16} /> Low Stock Warning
          </p>
          <div className="space-y-2">
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-surface-raised border border-border-subtle p-3">
                <span className="font-medium text-text-primary">{item.name}</span>
                <span className="text-sm text-error font-bold">
                  {item.onHand} {item.unit} <span className="text-text-tertiary font-normal">(reorder at {item.reorderLevel})</span>
                </span>
              </div>
            ))}
          </div>
          <PaginationControls
            page={lowStockPage}
            limit={lowStockLimit}
            onPageChange={setLowStockPage}
            onLimitChange={() => {}}
            hasMore={lowStock.length === lowStockLimit}
          />
        </div>
      )}

      {/* Stock table */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Stock Levels</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-tertiary text-xs">
                <th className="px-4 py-3 font-medium">Ingredient</th>
                <th className="px-4 py-3 font-medium text-right">On Hand</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Cost</th>
                <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Reorder At</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {stock.map((item, index) => {
                const isLow = item.belowReorder ?? item.onHand < item.reorderLevel;
                return (
                  <tr key={`${item.id}-${index}`} className={`border-b border-border-subtle last:border-0 ${isLow ? 'bg-error-muted/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {item.name}
                      {isLow && <span className="ml-2 text-xs text-error font-semibold">Low</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{item.onHand}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">{item.currentCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">{item.reorderLevel}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => { startInventoryEdit(item); setShowItemModal(true); }}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {stock.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-text-tertiary">No stock items yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4 pt-2">
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(0); }}
            hasMore={stock.length === limit}
          />
        </div>
      </div>

      {/* Movement history */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Movement History</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-tertiary text-xs">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Ingredient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-4 py-3 text-text-secondary">{new Date(movement.createdAt).toLocaleDateString('en-GH')}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{movement.ingredient?.name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{movement.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-right font-mono">{movement.quantity}</td>
                  <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{movement.reason || '—'}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-text-tertiary">No movements recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4 pt-2">
          <PaginationControls
            page={movementPage}
            limit={movementLimit}
            onPageChange={setMovementPage}
            onLimitChange={(value) => { setMovementLimit(value); setMovementPage(0); }}
            hasMore={movements.length === movementLimit}
          />
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      <Modal
        open={showItemModal}
        onClose={() => { setShowItemModal(false); resetInventoryForm(); }}
        title={editingIngredientId ? 'Edit Inventory Item' : 'Add Inventory Item'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowItemModal(false); resetInventoryForm(); }}>Cancel</Button>
            <Button type="submit" form="inventory-item-form" loading={inventorySaving}>
              {editingIngredientId ? 'Save Changes' : 'Add Item'}
            </Button>
          </>
        }
      >
        {inventoryError && <div className="mb-4 rounded-xl bg-error-muted p-3 text-sm text-error">{inventoryError}</div>}
        <form id="inventory-item-form" onSubmit={(e) => { handleInventorySubmit(e).then(() => setShowItemModal(false)); }} className="space-y-4 pt-2">
          <Input
            label="Ingredient Name"
            value={inventoryForm.name}
            onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
            required
            placeholder="e.g. Chicken Breast"
          />
          <Input
            label="Unit of Measurement"
            value={inventoryForm.unit}
            onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
            required
            placeholder="e.g. kg, litres, pieces"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cost per Unit (GHS)"
              type="number"
              min="0"
              step="0.01"
              value={inventoryForm.currentCost}
              onChange={(e) => setInventoryForm({ ...inventoryForm, currentCost: e.target.value === '' ? 0 : Number(e.target.value) })}
              placeholder="0.00"
            />
            <Input
              label="Reorder Level"
              type="number"
              min="0"
              value={inventoryForm.reorderLevel}
              onChange={(e) => setInventoryForm({ ...inventoryForm, reorderLevel: e.target.value === '' ? 0 : Number(e.target.value) })}
              placeholder="e.g. 10"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
