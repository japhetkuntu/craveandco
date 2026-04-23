'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { PaginationControls } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { HeartHandshake, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
          <HeartHandshake className="text-gold" /> Loyalty Program
        </h1>
        <Button onClick={() => setShowTransactionModal(true)}>
          Create Loyalty Transaction
        </Button>
      </div>

      <Modal
        open={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title="Create Loyalty Transaction"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTransactionModal(false)}>
              Cancel
            </Button>
            <Button loading={creatingTransaction} onClick={handleCreateTransaction}>
              Save Transaction
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateTransaction}>
          <div className="space-y-4">
            <label className="block text-sm text-text-secondary">
              Customer
              <select
                value={transactionCustomerId}
                onChange={(e) => setTransactionCustomerId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}{customer.loyaltyPoints != null ? ` (${customer.loyaltyPoints} pts)` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-text-secondary">
              Transaction Type
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as 'EARN' | 'REDEEM')}
                className="mt-2 w-full rounded-xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none"
              >
                <option value="EARN">Earn Points</option>
                <option value="REDEEM">Redeem Points</option>
              </select>
            </label>

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
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard
          title="Points Issued"
          value={(summary?.totalEarned || 0).toLocaleString()}
          icon={<Gift size={20} />}
          severity="healthy"
        />
        <KPICard
          title="Points Redeemed"
          value={(summary?.totalRedeemed || 0).toLocaleString()}
          icon={<Gift size={20} />}
          severity="warning"
        />
        <KPICard
          title="Outstanding Points"
          value={(summary?.netOutstanding || 0).toLocaleString()}
          icon={<HeartHandshake size={20} />}
        />
        <KPICard
          title="Redemption Rate"
          value={`${redemptionRate}%`}
          icon={<HeartHandshake size={20} />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
