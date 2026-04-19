'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Receipt, TrendingUp, TrendingDown, DollarSign, CheckCircle, XCircle } from 'lucide-react';

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
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Receipt className="text-gold" /> Finance
          </h1>
          <p className="text-sm text-text-secondary mt-1">Track cash, expenses, and approval workflows for your branch.</p>
        </div>
        <Button variant="secondary" onClick={() => setShowCreateExpense((prev) => !prev)}>
          {showCreateExpense ? 'Cancel Request' : 'Create Expense Request'}
        </Button>
      </div>

      {showCreateExpense && (
        <Card>
          <CardHeader>
            <CardTitle>New Expense Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateExpense} className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm text-text-secondary">
                Category
                <input
                  type="text"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, category: e.target.value }))}
                  required
                  className="rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-text-secondary">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-text-secondary md:col-span-3">
                Description
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, description: e.target.value }))}
                  className="rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none"
                />
              </label>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" loading={creatingExpense}>
                  Submit Expense Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Daily Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Today's Sales"
          value={formatCurrency(summary?.totalSales || 0)}
          icon={<TrendingUp size={20} />}
          severity="healthy"
        />
        <KPICard
          title="Today's Expenses"
          value={formatCurrency(summary?.totalExpenses || 0)}
          icon={<TrendingDown size={20} />}
          severity={(summary?.totalExpenses || 0) > (summary?.totalSales || 0) ? 'critical' : 'warning'}
        />
        <KPICard
          title="Net"
          value={formatCurrency(summary?.netCash || 0)}
          icon={<DollarSign size={20} />}
          severity={(summary?.netCash || 0) >= 0 ? 'healthy' : 'critical'}
        />
      </div>

      {summary?.reconciliation && (
        <Card>
          <CardHeader>
            <CardTitle>Cash Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-sm text-text-secondary">Expected Cash</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">{formatCurrency(summary.reconciliation.expectedCash)}</p>
              </div>
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-sm text-text-secondary">Actual Cash</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">{formatCurrency(summary.reconciliation.actualCash)}</p>
              </div>
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-sm text-text-secondary">Variance</p>
                <p className={`mt-2 text-xl font-semibold ${summary.reconciliation.variance >= 0 ? 'text-success' : 'text-error'}`}>
                  {formatCurrency(summary.reconciliation.variance)}
                </p>
              </div>
            </div>
            {summary.reconciliation.notes && (
              <p className="mt-4 text-sm text-text-secondary">Notes: {summary.reconciliation.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No expenses recorded</p>
          ) : (
            <>
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 bg-surface-base rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{exp.description}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        by {exp.user?.name} · {new Date(exp.createdAt).toLocaleDateString('en-GH')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary">
                        {formatCurrency(exp.amount)}
                      </span>
                      {exp.approved === null ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="secondary" onClick={() => handleApprove(exp.id)}>
                            <CheckCircle size={16} className="text-success" /> Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleReject(exp.id)}>
                            <XCircle size={16} className="text-error" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            exp.approved ? 'bg-success-muted text-success' : 'bg-error-muted text-error'
                          }`}
                        >
                          {exp.approved ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <PaginationControls
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(value) => { setLimit(value); setPage(0); }}
                hasMore={expenses.length === limit}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
