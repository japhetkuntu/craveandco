'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { buildQueryString, formatCurrency } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, Plus, X, Pencil } from 'lucide-react';
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
  totalAssetValue?: number;
}

// Human-readable movement type labels
const MOVEMENT_TYPES = [
  { value: 'PURCHASE_IN', label: 'Stock arrived (delivery received)' },
  { value: 'WASTE', label: 'Item wasted / thrown away' },
  { value: 'ADJUSTMENT', label: 'Count correction' },
  { value: 'USAGE', label: 'Used in production' },
];

export default function OpsInventoryPage() {
  const { token, user } = useAuth();
  const [stockData, setStockData] = useState<StockResponse | null>(null);
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockPage, setStockPage] = useState(0);
  const [stockLimit] = useState(15);
  const [movementPage, setMovementPage] = useState(0);
  const [movementLimit] = useState(10);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementData, setMovementData] = useState({ ingredientId: '', quantity: '', type: 'PURCHASE_IN', reason: '' });
  const [submittingMovement, setSubmittingMovement] = useState(false);

  // Edit ingredient form
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', unit: '', currentCost: 0, reorderLevel: 0 });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Add ingredient form (collapsible)
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', unit: '', currentCost: '', reorderLevel: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchData = async () => {
    if (!token) return;
    try {
      const [s, ls, ing, mv] = await Promise.all([
        get(`/api/v1/inventory/stock${buildQueryString({ page: stockPage, limit: stockLimit })}`, token),
        get('/api/v1/inventory/alerts/low-stock', token),
        get('/api/v1/inventory/ingredients?limit=100', token).catch(() => []),
        get(`/api/v1/inventory/movements${buildQueryString({ page: movementPage, limit: movementLimit })}`, token),
      ]);
      const sr = s as StockResponse;
      setStockData({
        ...sr,
        items: sr.items.map((item) => ({
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

  useEffect(() => { fetchData(); }, [token, stockPage, movementPage]);

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !addForm.name.trim()) { setAddError('Name is required'); return; }
    setAddSaving(true);
    setAddError('');
    try {
      await post('/api/v1/inventory/ingredients', {
        name: addForm.name.trim(),
        unit: addForm.unit.trim() || 'unit',
        currentCost: Number(addForm.currentCost) || 0,
        reorderLevel: Number(addForm.reorderLevel) || 0,
      }, token);
      setAddForm({ name: '', unit: '', currentCost: '', reorderLevel: '' });
      setShowAddForm(false);
      await fetchData();
    } catch {
      setAddError('Could not save. Please try again.');
    } finally {
      setAddSaving(false);
    }
  };

  const startEdit = (item: StockItem) => {
    setEditingItem(item);
    setEditForm({ name: item.name, unit: item.unit, currentCost: item.currentCost, reorderLevel: item.reorderLevel });
    setEditError('');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingItem) return;
    setEditSaving(true);
    try {
      await patch(`/api/v1/inventory/ingredients/${editingItem.id}`, {
        name: editForm.name.trim(),
        unit: editForm.unit.trim(),
        currentCost: Number(editForm.currentCost) || 0,
        reorderLevel: Number(editForm.reorderLevel) || 0,
      }, token);
      setEditingItem(null);
      await fetchData();
    } catch {
      setEditError('Could not save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.branchId) return;
    setSubmittingMovement(true);
    try {
      await post('/api/v1/inventory/movements', {
        ingredientId: movementData.ingredientId,
        branchId: user.branchId,
        quantity: parseFloat(movementData.quantity),
        type: movementData.type,
        reason: movementData.reason,
      }, token);
      setShowMovementForm(false);
      setMovementData({ ingredientId: '', quantity: '', type: 'PURCHASE_IN', reason: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingMovement(false);
    }
  };

  if (loading) return <PageSkeleton />;

  const stockItems = stockData?.items || [];
  const lowStockCount = stockData?.lowStockCount ?? 0;
  const totalAssetValue = stockData?.totalAssetValue ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Package className="text-gold" /> Inventory
          </h1>
          {lowStockCount > 0 ? (
            <p className="text-sm text-warning font-medium mt-1">
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low — scroll down to see them
            </p>
          ) : (
            <p className="text-sm text-success font-medium mt-1">All stock levels are okay</p>
          )}
        </div>
        <Button size="sm" onClick={() => setShowMovementForm(!showMovementForm)}>
          <Plus size={15} /> Record Stock Change
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-4">
          <p className="text-xs text-text-secondary">Total ingredients</p>
          <p className="text-2xl font-bold font-mono text-text-primary mt-1">{stockData?.totalCount ?? 0}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${lowStockCount > 0 ? 'bg-warning-muted border-warning/30' : 'bg-success-muted border-success/30'}`}>
          <p className="text-xs text-text-secondary">Running low</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${lowStockCount > 0 ? 'text-warning' : 'text-success'}`}>{lowStockCount}</p>
        </div>
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-4">
          <p className="text-xs text-text-secondary">Inventory asset value</p>
          <p className="text-2xl font-bold font-mono text-text-primary mt-1">{formatCurrency(totalAssetValue)}</p>
        </div>
      </div>

      {/* Record stock change form */}
      {showMovementForm && (
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Record a Stock Change</p>
              <button onClick={() => setShowMovementForm(false)} className="text-text-tertiary hover:text-text-secondary">
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="p-4">
            <form onSubmit={handleMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Which ingredient?</label>
                <select
                  value={movementData.ingredientId}
                  onChange={(e) => setMovementData({ ...movementData, ingredientId: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                  required
                >
                  <option value="">Choose an ingredient...</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">What happened?</label>
                <select
                  value={movementData.type}
                  onChange={(e) => setMovementData({ ...movementData, type: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                >
                  {MOVEMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={movementData.quantity}
                  onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
                  step="0.01"
                  className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Reason <span className="text-text-tertiary font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Weekly delivery from supplier"
                  value={movementData.reason}
                  onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                />
              </div>
              <Button type="submit" loading={submittingMovement} className="w-full">Save Stock Change</Button>
            </form>
          </div>
        </div>
      )}

      {/* Low stock alert section */}
      {lowStock.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary mb-3 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-warning" /> Running Low
          </h2>
          <div className="space-y-2">
            {lowStock.map((item) => (
              <div key={item.id} className="rounded-2xl bg-warning-muted border border-warning/30 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Only {item.onHand} {item.unit} left — reorder when below {item.reorderLevel}
                  </p>
                </div>
                <span className="text-xs font-bold text-warning bg-warning-muted px-2 py-1 rounded-full border border-warning/30">
                  Low
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All stock table */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">All Ingredients</p>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-sm text-gold font-semibold hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> Add new
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {/* Add form (inline collapsible) */}
          {showAddForm && (
            <div className="rounded-2xl bg-surface-elevated border border-border-subtle p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">Add New Ingredient</p>
              <form onSubmit={handleAddIngredient} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Tomatoes"
                    className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Unit</label>
                    <input
                      type="text"
                      value={addForm.unit}
                      onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                      placeholder="e.g. kg"
                      className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Reorder when below</label>
                    <input
                      type="number"
                      value={addForm.reorderLevel}
                      onChange={(e) => setAddForm({ ...addForm, reorderLevel: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary"
                      min={0}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={addSaving} size="sm">Save</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  {addError && <span className="text-xs text-error self-center">{addError}</span>}
                </div>
              </form>
            </div>
          )}

          {/* Edit form (inline, replaces row) */}
          {editingItem && (
            <div className="rounded-2xl bg-surface-elevated border border-gold/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Editing: {editingItem.name}</p>
                <button onClick={() => setEditingItem(null)} className="text-text-tertiary hover:text-text-secondary"><X size={16} /></button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Unit</label>
                    <input type="text" value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Cost per unit (GH₵)</label>
                    <input type="number" value={editForm.currentCost} onChange={(e) => setEditForm({ ...editForm, currentCost: Number(e.target.value) })}
                      step="0.01" min={0} className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Reorder when below</label>
                    <input type="number" value={editForm.reorderLevel} onChange={(e) => setEditForm({ ...editForm, reorderLevel: Number(e.target.value) })}
                      min={0} className="w-full h-12 px-3 rounded-xl border border-border-default bg-surface-input text-base text-text-primary" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={editSaving} size="sm">Save Changes</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditingItem(null)}>Cancel</Button>
                  {editError && <span className="text-xs text-error self-center">{editError}</span>}
                </div>
              </form>
            </div>
          )}

          {/* Stock list */}
          <div className="space-y-2">
            {stockItems.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-6">No ingredients yet</p>
            ) : (
              stockItems.map((item, index) => {
                const isLow = item.belowReorder ?? item.onHand < item.reorderLevel;
                return (
                  <div
                    key={`${item.id}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-xl border ${isLow ? 'bg-warning-muted border-warning/20' : 'bg-surface-elevated border-border-subtle'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isLow ? 'bg-warning' : 'bg-success'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                        <p className="text-xs text-text-tertiary">{item.onHand} {item.unit} on hand</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isLow && <span className="text-xs font-semibold text-warning">Low</span>}
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-surface-raised text-text-tertiary hover:text-text-secondary transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <PaginationControls
            page={stockPage}
            limit={stockLimit}
            onPageChange={setStockPage}
            onLimitChange={() => {}}
            hasMore={stockItems.length === stockLimit}
          />
        </div>
      </div>

      {/* Recent movements */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle"><p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Recent Stock Changes</p></div>
        <div className="p-4">
          {movements.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">No recent changes</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => {
                const typeLabel = MOVEMENT_TYPES.find((t) => t.value === m.type)?.label ?? m.type;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-border-subtle">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{m.ingredient?.name}</p>
                      <p className="text-xs text-text-secondary">{typeLabel}</p>
                      {m.reason && <p className="text-xs text-text-tertiary mt-0.5">{m.reason}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-text-primary">{m.quantity}</p>
                      <p className="text-xs text-text-tertiary">{new Date(m.createdAt).toLocaleDateString('en-GH')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3">
            <PaginationControls
              page={movementPage}
              limit={movementLimit}
              onPageChange={setMovementPage}
              onLimitChange={() => {}}
              hasMore={movements.length === movementLimit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
