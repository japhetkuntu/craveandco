'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageSkeleton } from '@/components/ui/skeleton';
import { IngredientCombobox } from '@/components/ui/ingredient-combobox';

interface WasteEntry {
  id: string;
  ingredient: { name: string; unit: string };
  quantity: number;
  reason: string;
  createdAt: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

export default function KitchenWastePage() {
  const { token } = useAuth();
  const [waste, setWaste] = useState<WasteEntry[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const w = await get(`/api/v1/kitchen/waste-logs${buildQueryString({ page, limit })}`, token);
      setWaste(w);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!token || !showModal) return;
    setIngredientsLoading(true);
    get(
      `/api/v1/inventory/ingredients${buildQueryString({ page: 0, limit: 100, search: ingredientSearch.trim() || undefined })}`,
      token,
    )
      .then((ing) => setIngredients(ing))
      .catch(() => setIngredients([]))
      .finally(() => setIngredientsLoading(false));
  }, [token, showModal, ingredientSearch]);

  const openModal = () => {
    setIngredientId('');
    setQuantity('');
    setReason('');
    setIngredientSearch('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const parsed = parseFloat(quantity);
    if (!ingredientId || Number.isNaN(parsed) || parsed <= 0) {
      toast('error', 'Check your inputs', 'Please select an ingredient and enter a quantity greater than 0.');
      return;
    }
    setSubmitting(true);
    try {
      await post('/api/v1/kitchen/waste-logs', { ingredientId, quantity: parsed, reason }, token);
      toast('success', 'Waste logged', 'Entry recorded successfully.');
      setShowModal(false);
      await fetchData();
    } catch (err) {
      toast('error', 'Could not log waste', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedIngredient = ingredients.find((i) => i.id === ingredientId);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Trash2 className="text-[var(--color-gold)]" size={22} /> Waste Log
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Track wasted or discarded ingredients</p>
        </div>
        <Button onClick={openModal} className="shrink-0">
          <Plus size={16} /> Log Waste
        </Button>
      </div>

      {/* Today's total if any */}
      {waste.length > 0 && (() => {
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = waste.filter((w) => w.createdAt.startsWith(today));
        return todayEntries.length > 0 ? (
          <div className="rounded-2xl border border-error/20 bg-error-muted px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-error">Today&apos;s waste entries</span>
            <span className="text-lg font-black font-mono text-error">{todayEntries.length}</span>
          </div>
        ) : null;
      })()}

      {/* Waste list */}
      {waste.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center rounded-3xl border border-dashed border-border-default">
          <Receipt size={44} className="text-text-tertiary opacity-30" />
          <p className="text-base font-semibold text-text-secondary">No waste entries logged</p>
          <p className="text-sm text-text-tertiary">Log waste to keep track of inventory losses</p>
        </div>
      ) : (
        <>
          <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden divide-y divide-border-subtle">
            {waste.map((w) => (
              <div key={w.id} className="flex items-center gap-4 px-4 py-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-error-muted flex items-center justify-center">
                  <Trash2 size={18} className="text-error" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{w.ingredient?.name}</p>
                  {w.reason && (
                    <p className="text-xs text-text-secondary mt-0.5 truncate">{w.reason}</p>
                  )}
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {new Date(w.createdAt).toLocaleString('en-GH', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-black text-error font-mono">
                    -{w.quantity}
                  </p>
                  <p className="text-xs text-text-tertiary">{w.ingredient?.unit}</p>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={() => {}}
            hasMore={waste.length === limit}
          />
        </>
      )}

      {/* Log Waste Modal */}
      {showModal && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Log Waste</h2>
                <p className="text-sm text-text-secondary mt-1">Record an ingredient that was wasted.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form id="waste-form" onSubmit={handleSubmit} className="space-y-4">
                <IngredientCombobox
                  label="What ingredient was wasted?"
                  ingredients={ingredients}
                  value={ingredientId}
                  onChange={setIngredientId}
                  onSearch={setIngredientSearch}
                  loading={ingredientsLoading}
                  placeholder="Search ingredients…"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    How much was wasted?{selectedIngredient ? ` (${selectedIngredient.unit})` : ''}
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    step="0.01"
                    min="0"
                    required
                    className="w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Reason <span className="text-text-tertiary font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. expired, dropped, burnt…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="waste-form" loading={submitting}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
