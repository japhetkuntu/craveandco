'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageSkeleton } from '@/components/ui/skeleton';

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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!token) return;
    try {
      const [w, ing] = await Promise.all([
        get(`/api/v1/kitchen/waste-logs${buildQueryString({ page, limit })}`, token),
        get('/api/v1/inventory/ingredients', token).catch(() => []),
      ]);
      setWaste(w);
      setIngredients(ing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token, page]);

  const openModal = () => {
    setIngredientId('');
    setQuantity('');
    setReason('');
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
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Log Waste"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="waste-form" loading={submitting}>Submit</Button>
          </>
        }
      >
        <form id="waste-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              What ingredient was wasted?
            </label>
            <select
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)}
              required
              className="w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
            >
              <option value="">Choose ingredient…</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit})
                </option>
              ))}
            </select>
          </div>

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
      </Modal>
    </div>
  );
}
