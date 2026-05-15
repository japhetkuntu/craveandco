'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { HeartHandshake, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface LoyaltySummary {
  totalEarned: number;
  totalRedeemed: number;
  netOutstanding: number;
}

interface CustomerOption {
  id: string;
  name: string;
  loyaltyPoints?: number;
}

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
  customer: { name: string };
}

export default function GrowthLoyaltyPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionCustomerId, setTransactionCustomerId] = useState('');
  const [transactionType, setTransactionType] = useState<'EARN' | 'REDEEM'>('EARN');
  const [transactionPoints, setTransactionPoints] = useState(0);
  const [transactionReference, setTransactionReference] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [creatingTransaction, setCreatingTransaction] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    Promise.all([
      get('/api/v1/loyalty/summary', token),
      get(`/api/v1/loyalty/transactions${buildQueryString({ page, limit })}`, token),
      get('/api/v1/customers?limit=50', token),
    ])
      .then(([s, t, c]) => {
        setSummary(s);
        setTransactions(t);
        setCustomers(c || []);
        if (!transactionCustomerId && Array.isArray(c) && c.length > 0) {
          setTransactionCustomerId(c[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, limit]);

  useEffect(() => {
    if (!token) return;

    get('/api/v1/customers?limit=50', token)
      .then((c) => {
        const customerOptions = Array.isArray(c)
          ? c.map((customer: any) => ({ id: customer.id, name: customer.name, loyaltyPoints: customer.loyaltyPoints }))
          : [];
        setCustomers(customerOptions);
        if (!transactionCustomerId && customerOptions.length > 0) {
          setTransactionCustomerId(customerOptions[0].id);
        }
      })
      .catch(console.error);
  }, [token, transactionCustomerId]);

  // Fetch balance when customer selection changes in modal
  useEffect(() => {
    if (!token || !transactionCustomerId || !showTransactionModal) return;
    setBalanceLoading(true);
    get(`/api/v1/loyalty/balance/${transactionCustomerId}`, token)
      .then((data) => setCustomerBalance(data.balance ?? 0))
      .catch(() => setCustomerBalance(null))
      .finally(() => setBalanceLoading(false));
  }, [token, transactionCustomerId, showTransactionModal]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        get('/api/v1/loyalty/summary', token),
        get(`/api/v1/loyalty/transactions${buildQueryString({ page, limit })}`, token),
      ]);
      setSummary(s);
      setTransactions(t);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!transactionCustomerId) {
      setTransactionError('Select a customer');
      return;
    }
    if (!transactionPoints || transactionPoints <= 0) {
      setTransactionError('Enter points greater than zero');
      return;
    }

    setCreatingTransaction(true);
    setTransactionError('');
    try {
      await post(
        '/api/v1/loyalty/transactions',
        {
          customerId: transactionCustomerId,
          type: transactionType,
          points: transactionPoints,
          reference: transactionReference || undefined,
        },
        token,
      );
      setShowTransactionModal(false);
      setTransactionPoints(0);
      setTransactionReference('');
      await fetchData();
    } catch (error: any) {
      setTransactionError(error.message || 'Failed to create loyalty transaction');
    } finally {
      setCreatingTransaction(false);
    }
  };

  const redemptionRate = summary?.totalEarned
    ? ((summary.totalRedeemed / summary.totalEarned) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <HeartHandshake className="text-[var(--color-gold)]" /> Loyalty Program
        </h1>
        <Button onClick={() => setShowTransactionModal(true)}>
          Create Loyalty Transaction
        </Button>
      </div>

      {showTransactionModal && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Create Loyalty Transaction</h2>
                <p className="text-sm text-text-secondary mt-1">Manually award or redeem points for a customer.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowTransactionModal(false)}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form id="loyalty-form" className="space-y-4" onSubmit={handleCreateTransaction}>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Customer</label>
                  <select
                    value={transactionCustomerId}
                    onChange={(e) => setTransactionCustomerId(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}{customer.loyaltyPoints != null ? ` (${customer.loyaltyPoints} pts)` : ''}
                      </option>
                    ))}
                  </select>
                  {transactionCustomerId && (
                    <p className="mt-1.5 text-xs font-semibold">
                      {balanceLoading ? 'Loading balance…' : customerBalance !== null ? (
                        <span className={customerBalance >= 0 ? 'text-success' : 'text-error'}>
                          Current balance: {customerBalance} pts
                        </span>
                      ) : null}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Transaction Type</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as 'EARN' | 'REDEEM')}
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="EARN">Earn Points</option>
                    <option value="REDEEM">Redeem Points</option>
                  </select>
                </div>

                <Input
                  label="Points"
                  type="number"
                  min={1}
                  value={transactionPoints}
                  onChange={(e) => setTransactionPoints(Number(e.target.value))}
                  required
                />

                <Input
                  label="Reference"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Order # or campaign reference"
                />

                {transactionError && (
                  <p className="text-sm text-error">{transactionError}</p>
                )}
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowTransactionModal(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" loading={creatingTransaction} onClick={handleCreateTransaction}>Save Transaction</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Points Issued</p>
          <p className="text-3xl font-bold font-mono text-text-primary mt-1">{(summary?.totalEarned || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-warning/30 bg-warning-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-warning">Points Redeemed</p>
          <p className="text-3xl font-bold font-mono text-warning mt-1">{(summary?.totalRedeemed || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Outstanding Points</p>
          <p className="text-3xl font-bold font-mono text-text-primary mt-1">{(summary?.netOutstanding || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-success/30 bg-success-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-success">Redemption Rate</p>
          <p className="text-3xl font-bold font-mono text-success mt-1">{redemptionRate}%</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Recent Transactions</p>
        </div>
        <div className="p-4">
          {transactions.length === 0 ? (
            <div className="space-y-4 py-6 text-center text-sm text-text-secondary">
              <p>No loyalty transactions have been recorded yet.</p>
              <p className="text-text-tertiary">
                Loyalty points are created when customers earn or redeem points. Create a loyalty transaction or integrate points via the loyalty module to populate this section.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-surface-base rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {tx.type === 'EARN' ? (
                        <ArrowUpRight size={18} className="text-success" />
                      ) : (
                        <ArrowDownRight size={18} className="text-gold" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-text-primary">{tx.customer?.name}</p>
                        <p className="text-xs text-text-tertiary">{tx.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'EARN' ? 'text-success' : 'text-gold'}`}>
                        {tx.type === 'EARN' ? '+' : '-'}{tx.points} pts
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(tx.createdAt).toLocaleDateString('en-GH')}
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
                hasMore={transactions.length === limit}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
