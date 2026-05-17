'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Receipt, Plus, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface Expense {
  id: string;
  description?: string;
  category: string;
  amount: number;
  approved: boolean | null;
  createdAt: string;
  user?: { name: string };
}

export default function OpsExpensesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [creatingExpense, setCreatingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '' });

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    get(`/api/v1/expenses${buildQueryString({ page, limit })}`, token)
      .then((data) => setExpenses(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, limit]);

  const handleCreateExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setCreatingExpense(true);
    try {
      await post('/api/v1/expenses', {
        category: newExpense.category,
        amount: Number(newExpense.amount),
        description: newExpense.description || undefined,
      }, token);
      setShowCreateExpense(false);
      setNewExpense({ category: '', amount: '', description: '' });
      setPage(0);
      const data = await get(`/api/v1/expenses${buildQueryString({ page: 0, limit })}`, token);
      setExpenses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingExpense(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Receipt className="text-[var(--color-gold)]" /> Expense records
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Log non-ingredient branch expenses like supplies, utilities or waste disposal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.push('/ops')}>
            <ArrowLeft size={16} /> Back to dashboard
          </Button>
          <Button onClick={() => setShowCreateExpense(true)}>
            <Plus size={16} /> Log Expense
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border-default bg-surface-raised p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Branch expense activity</p>
            <p className="text-xs text-text-secondary mt-1">These expenses are included in daily totals and owner reporting.</p>
          </div>
          <Button onClick={() => setShowCreateExpense(true)}>
            <Plus size={14} /> Add new expense
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Receipt size={32} className="text-text-tertiary opacity-50" />
            <p className="text-sm font-semibold text-text-secondary">No expenses recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text-primary">{expense.category}</p>
                  <p className="text-sm text-text-secondary mt-0.5">{expense.description || 'No description provided'}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    by {expense.user?.name || 'Unknown'} · {new Date(expense.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="text-xl font-bold font-mono text-text-primary">{formatCurrency(expense.amount)}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${expense.approved === null ? 'bg-warning-muted text-warning' : expense.approved ? 'bg-success-muted text-success' : 'bg-error-muted text-error'}`}>
                    {expense.approved === null ? 'Pending' : expense.approved ? 'Approved' : 'Rejected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 pb-4 pt-2">
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(0); }}
            hasMore={expenses.length === limit}
          />
        </div>
      </div>

      {showCreateExpense && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Log Expense</h2>
                <p className="text-sm text-text-secondary mt-1">Record a business expense.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowCreateExpense(false); setNewExpense({ category: '', amount: '', description: '' }); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form id="new-expense-form" onSubmit={handleCreateExpense} className="space-y-4">
                <Input
                  label="Category"
                  value={newExpense.category}
                  onChange={(event) => setNewExpense((prev) => ({ ...prev, category: event.target.value }))}
                  required
                  placeholder="e.g. Supplies, Utilities"
                />
                <Input
                  label="Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(event) => setNewExpense((prev) => ({ ...prev, amount: event.target.value }))}
                  required
                  placeholder="0.00"
                />
                <Input
                  label="Description (optional)"
                  value={newExpense.description}
                  onChange={(event) => setNewExpense((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="What was this expense for?"
                />
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowCreateExpense(false); setNewExpense({ category: '', amount: '', description: '' }); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="new-expense-form" loading={creatingExpense}>Submit Expense</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
