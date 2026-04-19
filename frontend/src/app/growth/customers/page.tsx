'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, UserPlus, Search, Plus, X, Phone, Mail, DollarSign, TrendingUp } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  visitCount: number;
  totalSpend: number;
  loyaltyPoints?: number;
  totalDiscount?: number;
  lastSeenAt: string;
}

interface CustomerDashboard {
  total: number;
  newThisWeek: number;
  activeThisMonth: number;
  churnRisk: number;
  totalSpend: number;
  totalVisits: number;
}

export default function GrowthCustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!token) return;
    try {
      const [c, d] = await Promise.all([
        get(`/api/v1/customers${buildQueryString({ page, limit })}`, token),
        get('/api/v1/customers/dashboard', token),
      ]);
      setCustomers(c);
      setDashboard(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token, page, limit]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await post('/api/v1/customers', {
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      }, token);
      setNewName(''); setNewPhone(''); setNewEmail('');
      setShowNew(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const filtered = search
    ? customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)),
    )
    : customers;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Users className="text-gold" /> Customers
        </h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard title="Total" value={dashboard?.total || 0} icon={<Users size={20} />} />
        <KPICard title="New This Week" value={dashboard?.newThisWeek || 0} icon={<UserPlus size={20} />} severity="healthy" />
        <KPICard title="Active" value={dashboard?.activeThisMonth || 0} icon={<Users size={20} />} severity="healthy" />
        <KPICard title="At Risk" value={dashboard?.churnRisk || 0} icon={<Users size={20} />} severity={dashboard?.churnRisk ? 'warning' : 'healthy'} />
        <KPICard title="Total Spend" value={dashboard?.totalSpend || 0} icon={<DollarSign size={20} />} isCurrency />
        <KPICard title="Visits" value={dashboard?.totalVisits || 0} icon={<TrendingUp size={20} />} />
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-gold focus:border-gold outline-none"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-text-secondary">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Visits</th>
                    <th className="px-4 py-3 font-medium">Points</th>
                    <th className="px-4 py-3 font-medium">Discounts</th>
                    <th className="px-4 py-3 font-medium">Total Spent</th>
                    <th className="px-4 py-3 font-medium">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gold-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.phone || '—'}</td>
                      <td className="px-4 py-3">{c.visitCount}</td>
                      <td className="px-4 py-3">{c.loyaltyPoints ?? 0}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(Number(c.totalDiscount || 0))}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(Number(c.totalSpend))}</td>
                      <td className="px-4 py-3 text-text-tertiary">
                        {c.lastSeenAt ? formatDate(c.lastSeenAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className="bg-surface-raised rounded-2xl border border-border-subtle p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-text-primary">{c.name}</p>
              <span className="text-sm font-bold text-gold">{formatCurrency(Number(c.totalSpend))}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
              {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
              <span>{c.visitCount} visits</span>
              <span>{c.loyaltyPoints ?? 0} pts</span>
              <span>Discount: {formatCurrency(Number(c.totalDiscount || 0))}</span>
              {c.lastSeenAt && <span>Last: {formatDate(c.lastSeenAt)}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-tertiary text-sm">No customers found</div>
        )}
      </div>

      <PaginationControls
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(value) => { setLimit(value); setPage(0); }}
        hasMore={customers.length === limit}
      />

      {/* New Customer Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-raised rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">New Customer</h2>
              <button onClick={() => { setShowNew(false); setError(''); }} className="text-text-tertiary hover:text-text-secondary p-1">
                <X size={20} />
              </button>
            </div>
            {error && <div className="mb-3 rounded-xl bg-error-muted p-3 text-sm text-error">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                placeholder="Customer name *"
                className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
              />
              <input
                type="tel"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
              />
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowNew(false); setError(''); }}
                  className="flex-1 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm"
                >
                  Cancel
                </button>
                <Button type="submit" loading={saving} className="flex-1">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
