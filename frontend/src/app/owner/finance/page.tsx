'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { formatCurrency } from '@/lib/utils';
import { Receipt, TrendingUp, TrendingDown, DollarSign, CheckCircle, XCircle, Plus } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/ui/export-button';

interface FinanceSummary {
  date: string;
  revenue: number;
  totalSales: number;
  expenditure: number;
  operatingExpenses: number;
  inventoryPurchaseExpense: number;
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
  const [range, setRange] = useState<'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getDateRange = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let from = formatDate(now);
    let to = formatDate(now);

    if (range === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      from = formatDate(yesterday);
      to = formatDate(yesterday);
    }
    if (range === 'thisWeek') {
      const monday = new Date(now);
      const day = monday.getDay();
      monday.setDate(monday.getDate() - ((day + 6) % 7));
      from = formatDate(monday);
      to = formatDate(now);
    }
    if (range === 'thisMonth') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      from = formatDate(firstOfMonth);
      to = formatDate(now);
    }
    if (range === 'thisYear') {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      from = formatDate(firstOfYear);
      to = formatDate(now);
    }
    if (range === 'custom') {
      from = customFrom || from;
      to = customTo || to;
    }

    return { from, to };
  };

  const [dateRange, setDateRange] = useState(getDateRange());

  useEffect(() => {
    setDateRange(getDateRange());
  }, [range, customFrom, customTo]);

  useEffect(() => {
    if (!token) return;
    const { from, to } = getDateRange();
    setLoading(true);
    Promise.all([
      get(`${API_PATHS.owner.dashboard}${buildQueryString({ from, to })}`, token),
      get(`/api/v1/expenses${buildQueryString({ page, limit, from, to })}`, token),
    ])
      .then(([s, e]) => {
        setSummary(s);
        setExpenses(e);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, limit, range, customFrom, customTo]);

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
      const { from, to } = getDateRange();
      const [s, e2] = await Promise.all([
        get(`${API_PATHS.owner.dashboard}${buildQueryString({ from, to })}`, token),
        get(`/api/v1/expenses${buildQueryString({ page, limit, from, to })}`, token),
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Receipt className="text-[var(--color-gold)]" /> Finance
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">Revenue, expenditure and inventory purchase cost comparison for the selected range.</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              filename="finance-expenses"
              sheets={[{
                name: 'Expenses',
                data: expenses,
                columns: [
                  { header: 'Date', value: (e) => new Date(e.createdAt).toLocaleDateString('en-GH') },
                  { header: 'Description', value: (e) => e.description },
                  { header: 'Category', value: (e) => e.category ?? '' },
                  { header: 'Amount (GHS)', value: (e) => Number(e.amount) },
                  { header: 'Status', value: (e) => e.approved === true ? 'Approved' : e.approved === false ? 'Rejected' : 'Pending' },
                  { header: 'Logged By', value: (e) => e.user?.name ?? '' },
                ],
              }]}
            />
            <Button onClick={() => setShowCreateExpense(true)}>
              <Plus size={16} /> Log Expense
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'thisWeek', label: 'This Week' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'thisYear', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${range === option.id ? 'bg-[var(--color-gold)] text-white' : 'bg-surface-input text-text-primary hover:bg-surface-raised'}`}
                onClick={() => setRange(option.id as any)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-secondary">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-secondary">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-success-muted border-success/30 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-success"><TrendingUp size={18} /><span>Revenue</span></div>
          <p className="text-3xl font-bold font-mono text-success whitespace-normal break-words">{formatCurrency(summary?.revenue || 0)}</p>
          <p className="text-xs text-text-secondary">Total incoming sales for the selected period</p>
        </div>
        <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${(summary?.expenditure || 0) > (summary?.revenue || 0) ? 'bg-error-muted border-error/30' : 'bg-warning-muted border-warning/30'}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${(summary?.expenditure || 0) > (summary?.revenue || 0) ? 'text-error' : 'text-warning'}`}><TrendingDown size={18} /><span>Expenditure</span></div>
          <p className={`text-3xl font-bold font-mono whitespace-normal break-words ${(summary?.expenditure || 0) > (summary?.revenue || 0) ? 'text-error' : 'text-warning'}`}>{formatCurrency(summary?.expenditure || 0)}</p>
          <p className="text-xs text-text-secondary">Includes operating expenses and inventory purchase cost</p>
        </div>
        <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${(summary?.netCash || 0) >= 0 ? 'bg-success-muted border-success/30' : 'bg-error-muted border-error/30'}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${(summary?.netCash || 0) >= 0 ? 'text-success' : 'text-error'}`}><DollarSign size={18} /><span>Net Cash</span></div>
          <p className={`text-3xl font-bold font-mono whitespace-normal break-words ${(summary?.netCash || 0) >= 0 ? 'text-success' : 'text-error'}`}>{formatCurrency(summary?.netCash || 0)}</p>
          <p className="text-xs text-text-secondary">Revenue minus expenditure</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border-default bg-surface-raised p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Expense Breakdown</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-base border border-border-subtle p-3">
              <p className="text-xs text-text-secondary">Operating Expenses</p>
              <p className="text-xl font-bold text-text-primary mt-2">{formatCurrency(summary?.operatingExpenses || 0)}</p>
            </div>
            <div className="rounded-2xl bg-surface-base border border-border-subtle p-3">
              <p className="text-xs text-text-secondary">Inventory Purchase Cost</p>
              <p className="text-xl font-bold text-text-primary mt-2">{formatCurrency(summary?.inventoryPurchaseExpense || 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border-default bg-surface-raised p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Range</p>
          <p className="text-sm text-text-primary">{dateRange.from} to {dateRange.to}</p>
          <p className="text-xs text-text-secondary">The selected period used for revenue and expenditure comparison.</p>
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
