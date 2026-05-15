'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, UserPlus, Search, Plus, Phone, DollarSign, TrendingUp, Cake, Pencil, Info } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
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

// ─── Customer Status Logic ──────────────────────────────────────────────────

type CustomerStatus = 'new' | 'loyal' | 'active' | 'fading' | 'at-risk' | 'inactive' | 'never';

function getCustomerStatus(c: Customer): CustomerStatus {
  if (!c.lastSeenAt) return 'never';
  const daysSince = Math.floor((Date.now() - new Date(c.lastSeenAt).getTime()) / 86400000);
  if (daysSince <= 30 && c.visitCount <= 2) return 'new';
  if (daysSince <= 30 && c.visitCount >= 10) return 'loyal';
  if (daysSince <= 30) return 'active';
  if (daysSince <= 60) return 'fading';
  if (daysSince <= 90) return 'at-risk';
  return 'inactive';
}

const STATUS_META: Record<CustomerStatus, { label: string; bg: string; text: string; dot: string; desc: string }> = {
  new:      { label: 'New',      bg: 'bg-info-muted',    text: 'text-info',    dot: 'bg-info',    desc: 'Visited in last 30 days, 1–2 visits total' },
  loyal:    { label: 'Loyal',    bg: 'bg-warning-muted', text: 'text-[var(--color-gold)]', dot: 'bg-[var(--color-gold)]', desc: 'Visited in last 30 days, 10+ visits' },
  active:   { label: 'Active',   bg: 'bg-success-muted', text: 'text-success', dot: 'bg-success', desc: 'Visited within the last 30 days' },
  fading:   { label: 'Fading',   bg: 'bg-warning-muted', text: 'text-warning', dot: 'bg-warning', desc: 'Last visit was 31–60 days ago' },
  'at-risk':{ label: 'At Risk',  bg: 'bg-error-muted',   text: 'text-error',   dot: 'bg-error',   desc: 'Last visit was 61–90 days ago' },
  inactive: { label: 'Inactive', bg: 'bg-surface-elevated', text: 'text-text-tertiary', dot: 'bg-text-tertiary', desc: 'No visit in over 90 days' },
  never:    { label: 'No Visits', bg: 'bg-surface-elevated', text: 'text-text-tertiary', dot: 'bg-text-tertiary', desc: 'Has never placed an order' },
};

function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function parseBirthday(birthday?: string) {
  if (!birthday) return null;
  const date = new Date(birthday);
  return Number.isNaN(date.getTime()) ? null : date;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Component ──────────────────────────────────────────────────────────────

export default function GrowthCustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLegend, setShowLegend] = useState(false);

  // Create modal state
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBirthdayMonth, setNewBirthdayMonth] = useState('');
  const [newBirthdayDay, setNewBirthdayDay] = useState('');

  // Edit modal state
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthdayMonth, setEditBirthdayMonth] = useState('');
  const [editBirthdayDay, setEditBirthdayDay] = useState('');

  const fetchData = async () => {
    if (!token) return;
    try {
      const [c, d] = await Promise.all([
        get(`/api/v1/customers${buildQueryString({ page, limit, search: search.trim() || undefined })}`, token),
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

  useEffect(() => { setLoading(true); fetchData(); }, [token, page, limit, search]);

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone ?? '');
    setEditEmail(c.email ?? '');
    const birthdayDate = parseBirthday(c.birthday);
    if (birthdayDate) {
      setEditBirthdayMonth(String(birthdayDate.getMonth() + 1));
      setEditBirthdayDay(String(birthdayDate.getDate()));
    } else {
      setEditBirthdayMonth('');
      setEditBirthdayDay('');
    }
    setError('');
  };

  const closeEdit = () => { setEditCustomer(null); setError(''); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const birthday = newBirthdayMonth && newBirthdayDay
        ? `2000-${newBirthdayMonth.padStart(2, '0')}-${newBirthdayDay.padStart(2, '0')}`
        : undefined;
      await post('/api/v1/customers', {
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        birthday,
      }, token);
      setNewName(''); setNewPhone(''); setNewEmail(''); setNewBirthdayMonth(''); setNewBirthdayDay('');
      setShowNew(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editCustomer || !editName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const birthday = editBirthdayMonth && editBirthdayDay
        ? `2000-${editBirthdayMonth.padStart(2, '0')}-${editBirthdayDay.padStart(2, '0')}`
        : editBirthdayMonth === '' && editBirthdayDay === '' && editCustomer.birthday
          ? null   // explicitly cleared
          : undefined;
      await patch(`/api/v1/customers/${editCustomer.id}`, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        ...(birthday !== undefined ? { birthday } : {}),
      }, token);
      closeEdit();
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Users className="text-[var(--color-gold)]" /> Customers
        </h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> Add Customer
        </Button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: dashboard?.total || 0, icon: <Users size={16} /> },
          { label: 'New This Week', value: dashboard?.newThisWeek || 0, icon: <UserPlus size={16} />, tone: 'green' as const },
          { label: 'Active', value: dashboard?.activeThisMonth || 0, icon: <Users size={16} />, tone: 'green' as const },
          { label: 'At Risk', value: dashboard?.churnRisk || 0, icon: <Users size={16} />, tone: (dashboard?.churnRisk ?? 0) > 0 ? 'red' as const : undefined },
          { label: 'Total Spend', value: formatCurrency(dashboard?.totalSpend || 0), icon: <DollarSign size={16} /> },
          { label: 'Total Visits', value: dashboard?.totalVisits || 0, icon: <TrendingUp size={16} /> },
        ].map(({ label, value, icon, tone }) => {
          const bg = tone === 'green' ? 'bg-success-muted border-success/20' : tone === 'red' ? 'bg-error-muted border-error/20' : 'bg-surface-raised border-border-subtle';
          const tv = tone === 'green' ? 'text-success' : tone === 'red' ? 'text-error' : 'text-text-primary';
          return (
            <div key={label} className={`rounded-2xl border p-3 flex flex-col gap-1.5 ${bg}`}>
              <div className="flex items-center gap-1.5 text-text-secondary text-xs">{icon}<span>{label}</span></div>
              <span className={`text-2xl font-bold font-mono ${tv}`}>{value}</span>
            </div>
          );
        })}
      </div>

      {/* Status legend toggle */}
      <div>
        <button
          onClick={() => setShowLegend(v => !v)}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <Info size={13} />
          <span>{showLegend ? 'Hide' : 'Show'} customer status legend</span>
        </button>
        {showLegend && (
          <div className="mt-3 rounded-2xl border border-border-subtle bg-surface-raised p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Status Legend</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.entries(STATUS_META) as [CustomerStatus, typeof STATUS_META[CustomerStatus]][]).map(([key, m]) => (
                <div key={key} className={`flex items-start gap-2.5 rounded-xl p-2.5 ${m.bg}`}>
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${m.dot}`} />
                  <div>
                    <p className={`text-xs font-bold ${m.text}`}>{m.label}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-[var(--color-gold)] outline-none bg-surface-input"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-text-secondary">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Birthday</th>
                    <th className="px-4 py-3 font-medium">Visits</th>
                    <th className="px-4 py-3 font-medium">Points</th>
                    <th className="px-4 py-3 font-medium">Discounts</th>
                    <th className="px-4 py-3 font-medium">Total Spent</th>
                    <th className="px-4 py-3 font-medium">Last Visit</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                      <td className="px-4 py-3"><CustomerStatusBadge status={getCustomerStatus(c)} /></td>
                      <td className="px-4 py-3 text-text-secondary">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {(() => {
                          const birthdayDate = parseBirthday(c.birthday);
                          return birthdayDate ? (
                            <span className="flex items-center gap-1">
                              <Cake size={13} className="text-[var(--color-gold)]" />
                              {birthdayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          ) : '—';
                        })()}
                      </td>
                      <td className="px-4 py-3">{c.visitCount}</td>
                      <td className="px-4 py-3">{c.loyaltyPoints ?? 0}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(Number(c.totalDiscount || 0))}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(Number(c.totalSpend))}</td>
                      <td className="px-4 py-3 text-text-tertiary">{c.lastSeenAt ? formatDate(c.lastSeenAt) : '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors"
                          title="Edit customer"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-text-tertiary">No customers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className="bg-surface-raised rounded-2xl border border-border-subtle p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-text-primary">{c.name}</p>
                <div className="mt-1"><CustomerStatusBadge status={getCustomerStatus(c)} /></div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-[var(--color-gold)]">{formatCurrency(Number(c.totalSpend))}</span>
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
              {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
              {(() => {
                const birthdayDate = parseBirthday(c.birthday);
                return birthdayDate ? (
                  <span className="flex items-center gap-1">
                    <Cake size={10} className="text-[var(--color-gold)]" />
                    {birthdayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                ) : null;
              })()}
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

      {/* ── Add Customer Modal ── */}
      {showNew && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Add Customer</h2>
                <p className="text-sm text-text-secondary mt-1">Fill in the customer's details.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowNew(false); setError(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {error && <div className="mb-4 rounded-xl bg-error-muted p-3 text-sm text-error">{error}</div>}
              <form id="new-customer-form" onSubmit={handleCreate} className="space-y-4">
                <Input label="Customer Name" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Kofi Mensah" />
                <Input label="Phone Number" type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="e.g. 024 000 0000" />
                <Input label="Email Address" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. kofi@email.com" />
                <BirthdayFields month={newBirthdayMonth} day={newBirthdayDay} onMonth={setNewBirthdayMonth} onDay={setNewBirthdayDay} />
              </form>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-border-subtle px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowNew(false); setError(''); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="new-customer-form" loading={saving}>Save Customer</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Customer Modal ── */}
      {!!editCustomer && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Edit Customer</h2>
                <p className="text-sm text-text-secondary mt-1">Update the customer's details.</p>
              </div>
              <Button variant="secondary" onClick={closeEdit}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {error && <div className="mb-4 rounded-xl bg-error-muted p-3 text-sm text-error">{error}</div>}
              <form id="edit-customer-form" onSubmit={handleUpdate} className="space-y-4">
                <Input label="Customer Name" value={editName} onChange={e => setEditName(e.target.value)} required placeholder="e.g. Kofi Mensah" />
                <Input label="Phone Number" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="e.g. 024 000 0000" />
                <Input label="Email Address" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="e.g. kofi@email.com" />
                <BirthdayFields month={editBirthdayMonth} day={editBirthdayDay} onMonth={setEditBirthdayMonth} onDay={setEditBirthdayDay} />
              </form>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-border-subtle px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={closeEdit}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="edit-customer-form" loading={saving}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared birthday picker ───────────────────────────────────────────────────
function BirthdayFields({ month, day, onMonth, onDay }: {
  month: string; day: string;
  onMonth: (v: string) => void; onDay: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-text-secondary">Birthday (optional)</label>
      <p className="text-xs text-text-tertiary">Just the day and month — we'll use this to celebrate with them!</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-text-tertiary">Month</label>
          <select
            value={month}
            onChange={e => onMonth(e.target.value)}
            className="h-12 w-full rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          >
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-text-tertiary">Day</label>
          <select
            value={day}
            onChange={e => onDay(e.target.value)}
            className="h-12 w-full rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={String(d)}>{d}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

