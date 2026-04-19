'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Receipt, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

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
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
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

  useEffect(() => {
    fetchData();
  }, [token, page, limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const parsedQuantity = parseFloat(quantity);
    if (!ingredientId || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast('error', 'Invalid waste quantity', 'Please enter a quantity greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      await post('/api/v1/kitchen/waste-logs', {
        ingredientId,
        quantity: parsedQuantity,
        reason,
      }, token);
      toast('success', 'Waste logged', 'Waste entry recorded successfully.');
      setShowForm(false);
      setIngredientId('');
      setQuantity('');
      setReason('');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast('error', 'Could not log waste', err instanceof Error ? err.message : 'Please try again.');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Receipt className="text-gold" /> Waste Log
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Log Waste
        </Button>
      </div>

      {/* Quick Form */}
      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                value={ingredientId}
                onChange={(e) => setIngredientId(e.target.value)}
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm bg-surface-raised focus:ring-2 focus:ring-gold focus:border-transparent"
                required
              >
                <option value="">Select ingredient...</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Reason (e.g. expired, dropped)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold focus:border-transparent"
              />
              <Button type="submit" loading={submitting} className="w-full">
                Submit Waste Entry
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Waste Entries */}
      {waste.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">No waste entries logged</p>
      ) : (
        <>
          <div className="space-y-2">
            {waste.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 bg-surface-base rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {w.ingredient?.name}
                  </p>
                  {w.reason && (
                    <p className="text-xs text-text-tertiary mt-0.5">{w.reason}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-error">
                    -{w.quantity} {w.ingredient?.unit}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {new Date(w.createdAt).toLocaleString('en-GH')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(0); }}
            hasMore={waste.length === limit}
          />
        </>
      )}
    </div>
  );
}
