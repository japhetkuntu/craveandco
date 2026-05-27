'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch, del } from '@/lib/api';
import { buildQueryString, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Package, AlertTriangle, Plus, Trash2, Search } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/ui/export-button';
import { SortableHeader, useSortable } from '@/components/ui/sortable-header';

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
  totalOnHand?: number;
}

interface MovementEntry {
  id: string;
  createdAt: string;
  ingredient?: { name: string };
  type: string;
  quantity: number;
  reason?: string;
}

const STOCK_ACCESSORS = {
  name:         (r: StockItem) => r.name,
  onHand:       (r: StockItem) => r.onHand,
  unit:         (r: StockItem) => r.unit,
  currentCost:  (r: StockItem) => r.currentCost,
  reorderLevel: (r: StockItem) => r.reorderLevel,
  totalValue:   (r: StockItem) => r.onHand * r.currentCost,
};

const MOVEMENT_ACCESSORS = {
  createdAt:      (r: MovementEntry) => r.createdAt,
  ingredientName: (r: MovementEntry) => r.ingredient?.name ?? '',
  type:           (r: MovementEntry) => r.type,
  quantity:       (r: MovementEntry) => r.quantity,
};

export default function OwnerInventoryPage() {
  const { token } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalAssetValue, setTotalAssetValue] = useState(0);
  const [totalOnHand, setTotalOnHand] = useState(0);
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
  const [stockSearch, setStockSearch] = useState('');
  const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const lowStockPercent = totalItems > 0 ? Math.round((lowStockCount / totalItems) * 100) : 0;

  const movementCountData = movementAnalytics ? [
    { name: 'Purchased', value: movementAnalytics.typeCounts.PURCHASE_IN || 0 },
    { name: 'Used', value: movementAnalytics.typeCounts.USAGE || 0 },
    { name: 'Wasted', value: movementAnalytics.typeCounts.WASTE || 0 },
    { name: 'Adjusted', value: movementAnalytics.typeCounts.ADJUSTMENT || 0 },
    { name: 'Stock Count', value: movementAnalytics.typeCounts.STOCK_COUNT || 0 },
  ] : [];

  const movementQuantityData = movementAnalytics ? [
    { name: 'Purchased', value: movementAnalytics.typeQuantities.PURCHASE_IN || 0 },
    { name: 'Used', value: movementAnalytics.typeQuantities.USAGE || 0 },
    { name: 'Wasted', value: movementAnalytics.typeQuantities.WASTE || 0 },
    { name: 'Adjusted', value: movementAnalytics.typeQuantities.ADJUSTMENT || 0 },
  ] : [];

  const movementColors = ['#2563eb', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

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

  const handleDelete = (item: StockItem) => {
    setDeletingItem(item);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!token || !deletingItem) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await del(`/api/v1/inventory/ingredients/${deletingItem.id}`, token);
      setDeletingItem(null);
      await loadStock();
    } catch (err) {
      console.error(err);
      setDeleteError('Could not delete this item. It may be referenced by existing records.');
    } finally {
      setDeleteLoading(false);
    }
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
        reorderLevel: Number(inventoryForm.reorderLevel) > 0 ? Number(inventoryForm.reorderLevel) : 5,
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
        get(`/api/v1/inventory/stock${buildQueryString({ page, limit, search: stockSearch.trim() || undefined })}`, token),
        get(`/api/v1/inventory/alerts/low-stock${buildQueryString({ page: lowStockPage, limit: lowStockLimit })}`, token),
        get('/api/v1/inventory/movements/analytics', token),
        get(`/api/v1/inventory/movements${buildQueryString({ page: movementPage, limit: movementLimit })}`, token),
      ]);
      const response = stockResponse as StockResponse;
      const normalizedItems = response.items.map((item) => ({
        ...item,
        currentCost: Number(item.currentCost),
        reorderLevel: Number(item.reorderLevel || 5),
      }));
      setStock(normalizedItems);
      setTotalItems(response.totalCount);
      setLowStockCount(response.lowStockCount);
      setTotalAssetValue(response.totalAssetValue ?? 0);
      setTotalOnHand(response.totalOnHand ?? 0);
      setLowStock(lowStockItems);
      setMovementAnalytics(movementAnalyticsResponse);
      setMovements(movementHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, stockSearch, lowStockPage, lowStockLimit, movementPage, movementLimit]);

  useEffect(() => {
    void loadStock();
  }, [loadStock]);

  // Client-side sorting (current page)
  const { sorted: sortedStock, sort: stockSort, toggle: toggleStock } = useSortable(stock, STOCK_ACCESSORS);
  const { sorted: sortedMovements, sort: movSort, toggle: toggleMov } = useSortable(movements, MOVEMENT_ACCESSORS);

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
        <div className="flex items-center gap-2">
          <ExportButton
            filename="inventory"
            sheets={[
              {
                name: 'Stock',
                data: stock,
                columns: [
                  { header: 'Ingredient', value: (r) => r.name },
                  { header: 'Unit', value: (r) => r.unit },
                  { header: 'On Hand', value: (r) => Number(r.onHand) },
                  { header: 'Reorder Level', value: (r) => Number(r.reorderLevel) },
                  { header: 'Unit Cost (GHS)', value: (r) => Number(r.currentCost) },
                  { header: 'Total Value (GHS)', value: (r) => Number((r.onHand * r.currentCost).toFixed(2)) },
                  { header: 'Status', value: (r) => r.belowReorder ? 'Low Stock' : 'OK' },
                ],
              } ,
              {
                name: 'Movements',
                data: movements,
                columns: [
                  { header: 'Date', value: (r) => new Date(r.createdAt).toLocaleString('en-GH') },
                  { header: 'Ingredient', value: (r) => r.ingredient?.name ?? '' },
                  { header: 'Type', value: (r) => r.type },
                  { header: 'Quantity', value: (r) => Number(r.quantity) },
                  { header: 'Reason', value: (r) => r.reason ?? '' },
                ],
              } ,
            ]}
          />
          <Button onClick={() => { resetInventoryForm(); setShowItemModal(true); }}>
            <Plus size={16} /> Add Item
          </Button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Package size={18} />, label: 'Total Items', value: totalItems, tone: undefined },
          { icon: <AlertTriangle size={18} />, label: 'Low Stock', value: lowStockCount, tone: lowStockCount > 0 ? 'red' as const : 'green' as const },
          { icon: <Package size={18} />, label: 'Inventory Worth', value: formatCurrency(totalAssetValue), tone: undefined },
          { icon: <Package size={18} />, label: 'Total Quantity', value: Number(totalOnHand).toFixed(2), tone: undefined },
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
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Movement Analytics</p>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-border-subtle bg-white p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">Movement counts</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={movementCountData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => [value, 'Movements']} />
                    <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-3xl border border-border-subtle bg-white p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">Quantity breakdown</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={movementQuantityData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={80}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {movementQuantityData.map((entry, index) => (
                        <Cell key={entry.name} fill={movementColors[index % movementColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [Number(value).toFixed(2), 'Units']} />
                    <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12, lineHeight: '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'All Movements', count: movementAnalytics.totalMovements, qty: null, tone: 'default' },
              { label: 'Purchased', count: movementAnalytics.typeCounts.PURCHASE_IN || 0, qty: movementAnalytics.typeQuantities.PURCHASE_IN || 0, tone: 'green' },
              { label: 'Used', count: movementAnalytics.typeCounts.USAGE || 0, qty: movementAnalytics.typeQuantities.USAGE || 0, tone: 'default' },
              { label: 'Wasted', count: movementAnalytics.typeCounts.WASTE || 0, qty: movementAnalytics.typeQuantities.WASTE || 0, tone: 'red' },
              { label: 'Adjustments', count: movementAnalytics.typeCounts.ADJUSTMENT || 0, qty: movementAnalytics.typeQuantities.ADJUSTMENT || 0, tone: 'yellow' },
              { label: 'Stock Counts', count: movementAnalytics.typeCounts.STOCK_COUNT || 0, qty: null, tone: 'default' },
            ].map(({ label, count, qty, tone }) => {
              const tv = tone === 'green' ? 'text-success' : tone === 'red' ? 'text-error' : tone === 'yellow' ? 'text-warning' : 'text-text-primary';
              const bg = tone === 'green' ? 'bg-success-muted' : tone === 'red' ? 'bg-error-muted' : tone === 'yellow' ? 'bg-warning-muted' : '';
              return (
                <div key={label} className={`p-4 border-r border-b border-border-subtle last:border-r-0 flex flex-col gap-0.5 ${bg}`}>
                  <p className="text-xs text-text-tertiary">{label}</p>
                  <p className={`text-2xl font-bold font-mono ${tv}`}>{count}</p>
                  {qty !== null && <p className="text-xs text-text-tertiary font-mono">{Number(qty).toFixed(2)} units</p>}
                </div>
              );
            })}
          </div>
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
                  {Number(item.onHand).toFixed(2)} {item.unit} <span className="text-text-tertiary font-normal">(reorder at {Number(item.reorderLevel).toFixed(2)})</span>
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
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Stock Levels</p>
        </div>
        <div className="px-4 pb-3 border-b border-border-subtle">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="search"
              placeholder="Search ingredients…"
              value={stockSearch}
              onChange={(e) => { setStockSearch(e.target.value); setPage(0); }}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-border-default bg-surface-input text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/40"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-tertiary text-xs">
                <SortableHeader col="name" sort={stockSort} onToggle={toggleStock}>Ingredient</SortableHeader>
                <SortableHeader col="onHand" sort={stockSort} onToggle={toggleStock} align="right">On Hand</SortableHeader>
                <SortableHeader col="unit" sort={stockSort} onToggle={toggleStock}>Unit</SortableHeader>
                <SortableHeader col="currentCost" sort={stockSort} onToggle={toggleStock} align="right" className="hidden sm:table-cell">Cost</SortableHeader>
                <SortableHeader col="reorderLevel" sort={stockSort} onToggle={toggleStock} align="right" className="hidden sm:table-cell">Reorder At</SortableHeader>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sortedStock.map((item, index) => {
                const isLow = item.belowReorder ?? item.onHand < item.reorderLevel;
                return (
                  <tr key={`${item.id}-${index}`} className={`border-b border-border-subtle last:border-0 ${isLow ? 'bg-error-muted/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {item.name}
                      {isLow && <span className="ml-2 text-xs text-error font-semibold">Low</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{Number(item.onHand).toFixed(2)}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">{item.currentCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">{item.reorderLevel.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { startInventoryEdit(item); setShowItemModal(true); }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDelete(item)} className="text-error hover:border-error/50">
                          <Trash2 size={14} />
                        </Button>
                      </div>
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
                <SortableHeader col="createdAt" sort={movSort} onToggle={toggleMov}>Date</SortableHeader>
                <SortableHeader col="ingredientName" sort={movSort} onToggle={toggleMov}>Ingredient</SortableHeader>
                <SortableHeader col="type" sort={movSort} onToggle={toggleMov}>Type</SortableHeader>
                <SortableHeader col="quantity" sort={movSort} onToggle={toggleMov} align="right">Qty</SortableHeader>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody>
              {sortedMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-4 py-3 text-text-secondary">{new Date(movement.createdAt).toLocaleDateString('en-GH')}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{movement.ingredient?.name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{movement.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-right font-mono">{Number(movement.quantity).toFixed(2)}</td>
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

      {/* Delete Confirm Modal */}
      {deletingItem && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error-muted flex items-center justify-center">
                  <Trash2 size={18} className="text-error" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Delete Ingredient</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Are you sure you want to delete <strong className="text-text-primary">{deletingItem.name}</strong>? This cannot be undone.
                  </p>
                </div>
              </div>
              {deleteError && <div className="rounded-2xl bg-error-muted p-3 text-sm text-error">{deleteError}</div>}
            </div>
            <div className="border-t border-border-subtle px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeletingItem(null)} disabled={deleteLoading}>Cancel</Button>
              <Button variant="primary" className="flex-1 !bg-red-600 !border-red-600 hover:!bg-red-700" onClick={confirmDelete} loading={deleteLoading}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  {editingIngredientId ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {editingIngredientId ? 'Update the item details below.' : 'Add a new ingredient to your inventory.'}
                </p>
              </div>
              <Button variant="secondary" onClick={() => { setShowItemModal(false); resetInventoryForm(); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {inventoryError && <div className="rounded-2xl bg-error-muted p-3 text-sm text-error">{inventoryError}</div>}
              <form id="inventory-item-form" onSubmit={(e) => { handleInventorySubmit(e).then(() => setShowItemModal(false)); }} className="space-y-4">
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
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowItemModal(false); resetInventoryForm(); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="inventory-item-form" loading={inventorySaving}>
                {editingIngredientId ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
