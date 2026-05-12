'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/utils';
import { Receipt, TrendingUp, TrendingDown, DollarSign, CheckCircle, XCircle, Plus } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface FinanceSummary {
  date: string;
  totalSales: number;
  totalExpenses: number;
  netCash: number;
  reconciliation?: {
    expectedCash: number;
    actualCash: number;
    variance: number;
    notes?: string;
  };
}

interface Expense {
  id: string;
  description: string;
  category?: string;
  amount: number;
  approved: boolean | null;
  createdAt: string;
  user: { name: string };
}

export default function OwnerFinancePage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [creatingExpense, setCreatingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '' });

  useEffect(() => {
    if (!token) return;
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      get(`/api/v1/finance/daily-summary?date=${today}`, token),
      get(`/api/v1/expenses${buildQueryString({ page, limit })}`, token),
    ])
      .then(([s, e]) => {
        setSummary(s);
        setExpenses(e);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, limit]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      await post(`/api/v1/owner/approvals/${id}/approve`, {}, token);
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, approved: true } : e)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    try {
      await post(`/api/v1/owner/approvals/${id}/reject`, {}, token);
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, approved: false } : e)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const today = new Date().toISOString().split('T')[0];
      const [s, e2] = await Promise.all([
        get(`/api/v1/finance/daily-summary?date=${today}`, token),
        get(`/api/v1/expenses${buildQueryString({ page, limit })}`, token),
      ]);
      setSummary(s);
      setExpenses(e2);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingExpense(false);
    }
  };
  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Receipt className="text-[var(--color-gold)]" /> Finance
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Today&apos;s cash, expenses and approvals</p>
        </div>
        <Button onClick={() => setShowCreateExpense(true)}>
          <Plus size={16} /> Log Expense
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-success-muted border-success/30 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-success"><TrendingUp size={18} /><span>Today&apos;s Sales</span></div>
          <p className="text-3xl font-bold font-mono text-success whitespace-normal break-words">{formatCurrency(summary?.totalSales || 0)}</p>
          <p className="text-xs text-text-secondary">Total revenue collected today</p>
        </div>
        <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${(summary?.totalExpenses || 0) > (summary?.totalSales || 0) ? 'bg-error-muted border-error/30' : 'bg-warning-muted border-warning/30'}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${(summary?.totalExpenses || 0) > (summary?.totalSales || 0) ? 'text-error' : 'text-warning'}`}><TrendingDown size={18} /><span>Today&apos;s Expenses</span></div>
          <p className={`text-3xl font-bold font-mono whitespace-normal break-words ${(summary?.totalExpenses || 0) > (summary?.totalSales || 0) ? 'text-error' : 'text-warning'}`}>{formatCurrency(summary?.totalExpenses || 0)}</p>
          <p className="text-xs text-text-secondary">All approved and pending expenses</p>
        </div>
        <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${(summary?.netCash || 0) >= 0 ? 'bg-success-muted border-success/30' : 'bg-error-muted border-error/30'}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${(summary?.netCash || 0) >= 0 ? 'text-success' : 'text-error'}`}><DollarSign size={18} /><span>Net Cash</span></div>
          <p className={`text-3xl font-bold font-mono whitespace-normal break-words ${(summary?.netCash || 0) >= 0 ? 'text-success' : 'text-error'}`}>{formatCurrency(summary?.netCash || 0)}</p>
          <p className="text-xs text-text-secondary">Sales minus expenses</p>
        </div>
      </div>

      {/* Reconciliation */}
      {summary?.reconciliation && (
        <div className="rounded-3xl border border-border-default bg-surface-raised p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Cash Reconciliation</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Expected Cash', value: summary.reconciliation.expectedCash },
              { label: 'Actual Cash', value: summary.reconciliation.actualCash },
              { label: 'Variance', value: summary.reconciliation.variance },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-surface-elevated border border-border-subtle p-3 text-center">
                <p className="text-xs text-text-tertiary">{label}</p>
                <p className={`text-xl font-bold font-mono mt-1 ${label === 'Variance' ? (value >= 0 ? 'text-success' : 'text-error') : 'text-text-primary'}`}>
                  {formatCurrency(value)}
                </p>
              </div>
            ))}
          </div>
          {summary.reconciliation.notes && (
            <p className="text-sm text-text-secondary">Note: {summary.reconciliation.notes}</p>
          )}
        </div>
      )}

      {/* Expenses list */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary mb-3">Expense Records</p>
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Receipt size={32} className="text-text-tertiary opacity-50" />
              <p className="text-sm font-semibold text-text-secondary">No expenses recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">{exp.description || exp.category || '—'}</p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      by <span className="font-medium">{exp.user?.name}</span> · {new Date(exp.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <span className="text-xl font-bold font-mono text-text-primary whitespace-normal break-words">
                      {formatCurrency(exp.amount)}
                    </span>
                    {exp.approved === null ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleApprove(exp.id)}>
                          <CheckCircle size={14} className="text-success" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(exp.id)}>
                          <XCircle size={14} /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${exp.approved ? 'bg-success-muted text-success' : 'bg-error-muted text-error'}`}>
                        {exp.approved ? 'Approved' : 'Rejected'}
                      </span>
                    )}
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
      </div>

      {/* Log Expense Modal */}
      <Modal
        open={showCreateExpense}
        onClose={() => { setShowCreateExpense(false); setNewExpense({ category: '', amount: '', description: '' }); }}
        title="Log Expense"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateExpense(false)}>Cancel</Button>
            <Button type="submit" form="new-expense-form" loading={creatingExpense}>Submit Expense</Button>
          </>
        }
      >
        <form id="new-expense-form" onSubmit={handleCreateExpense} className="space-y-4 pt-2">
          <Input
            label="Category"
            value={newExpense.category}
            onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
            required
            placeholder="e.g. Supplies, Utilities"
          />
          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={newExpense.amount}
            onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
            required
            placeholder="0.00"
          />
          <Input
            label="Description (optional)"
            value={newExpense.description}
            onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What was this expense for?"
          />
        </form>
      </Modal>
    </div>
  );
}
