'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch, del } from '@/lib/api';
import { buildQueryString, formatCurrency, formatDate } from '@/lib/utils';
import { API_PATHS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { Modal } from '@/components/ui/modal';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Users, UserPlus, Search, Plus, Phone, DollarSign, TrendingUp, Cake, Pencil, Info, MessageSquare, CheckSquare, Trash2 } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/ui/export-button';
import { SortableHeader, type SortState } from '@/components/ui/sortable-header';

function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred') {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

// ─── Types ───────────────────────────────────────────────────────────────────

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
  createdAt: string;
}

interface CustomerDashboard {
  total: number;
  newThisWeek: number;
  activeThisMonth: number;
  churnRisk: number;
  totalSpend: number;
  totalVisits: number;
}

interface CustomerInsights {
  customerId: string;
  customerName: string;
  lastOrderAt: string | null;
  daysSinceLastOrder: number | null;
  totalOrders: number;
  ordersLast7Days: number;
  ordersLast14Days: number;
  ordersLast21Days: number;
  averageOrderValue: number;
  totalSpend: number;
  averageDaysBetweenOrders: number | null;
  favoriteCategory?: string;
  topItems: Array<{ name: string; quantity: number; spend: number }>;
  channelBreakdown: Array<{ channel: string; count: number; sharePercent: number }>;
  customerStatus: CustomerStatus;
  preferredContact: 'sms' | 'email' | 'none';
  recommendedMessage: string;
  birthday?: string | null;
}

// ─── Customer Status ──────────────────────────────────────────────────────────

type CustomerStatus = 'new' | 'loyal' | 'active' | 'fading' | 'at-risk' | 'inactive' | 'never';

function getCustomerStatus(c: Customer): CustomerStatus {
  if (!c.lastSeenAt) return 'never';
  const daysSince = Math.floor((Date.now() - new Date(c.lastSeenAt).getTime()) / 86400000);
  if (daysSince <= 7 && c.visitCount <= 2) return 'new';
  if (daysSince <= 7 && c.visitCount >= 4) return 'loyal';
  if (daysSince <= 7) return 'active';
  if (daysSince <= 14) return 'fading';
  if (daysSince <= 21) return 'at-risk';
  return 'inactive';
}

const STATUS_META: Record<CustomerStatus, { label: string; bg: string; text: string; dot: string; desc: string }> = {
  new:       { label: 'New',       bg: 'bg-info-muted',       text: 'text-info',    dot: 'bg-info',    desc: 'Visited in the last 7 days, 1–2 visits total' },
  loyal:     { label: 'Loyal',     bg: 'bg-warning-muted',    text: 'text-[var(--color-gold)]', dot: 'bg-[var(--color-gold)]', desc: 'Visited in the last 7 days, 4+ visits' },
  active:    { label: 'Active',    bg: 'bg-success-muted',    text: 'text-success', dot: 'bg-success', desc: 'Visited within the last 7 days' },
  fading:    { label: 'Fading',    bg: 'bg-warning-muted',    text: 'text-warning', dot: 'bg-warning', desc: 'Last visit was 8–14 days ago' },
  'at-risk': { label: 'At Risk',   bg: 'bg-error-muted',      text: 'text-error',   dot: 'bg-error',   desc: 'Last visit was 15–21 days ago' },
  inactive:  { label: 'Inactive',  bg: 'bg-surface-elevated', text: 'text-text-tertiary', dot: 'bg-text-tertiary', desc: 'No visit in over 21 days' },
  never:     { label: 'No Visits', bg: 'bg-surface-elevated', text: 'text-text-tertiary', dot: 'bg-text-tertiary', desc: 'Has never placed an order' },
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

function InsightStat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-3xl border border-border-subtle bg-surface-base p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">{label}</p>
      <p className="text-xl font-semibold text-text-primary">{value}</p>
      {note ? <p className="mt-2 text-sm text-text-secondary">{note}</p> : null}
    </div>
  );
}

function InsightProgress({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{label}</span>
        <span className="font-semibold text-text-primary">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
        <div className="h-full rounded-full bg-[var(--color-gold)]" style={{ width: `${Math.max(6, Math.min(value, 100))}%` }} />
      </div>
    </div>
  );
}

function getCustomerSmsTemplates(insights: CustomerInsights) {
  const nameToken = '{name}';
  const statusTemplates: Record<CustomerStatus, Array<{ label: string; message: string; reason: string }>> = {
    new: [
      {
        label: 'Welcome offer',
        message: `Hi ${nameToken}, welcome to Crave & Co! Enjoy 15% off your next meal this week when you order again.`,
        reason: 'Great for new customers getting comfortable with your menu.',
      },
    ],
    loyal: [
      {
        label: 'Thank you',
        message: `Hi ${nameToken}, thanks for being one of our most-loved customers! Show this message for 20% off your next order.`,
        reason: 'Rewards loyalty and encourages another visit.',
      },
    ],
    active: [
      {
        label: 'Keep them coming',
        message: `Hi ${nameToken}, we love serving you. Come back soon and enjoy a free drink with your next pickup.`,
        reason: 'A gentle nudge for active customers to return soon.',
      },
    ],
    fading: [
      {
        label: 'We miss you',
        message: `Hi ${nameToken}, it’s been a little while. Enjoy 20% off your next order and treat yourself this week.`,
        reason: 'Re-engages customers whose visits are slowing down.',
      },
    ],
    'at-risk': [
      {
        label: 'Bring them back',
        message: `Hi ${nameToken}, we haven’t seen you lately. Here’s 25% off your next Crave & Co meal to make your return extra tasty.`,
        reason: 'A stronger offer for customers at risk of churn.',
      },
    ],
    inactive: [
      {
        label: 'Come back',
        message: `Hi ${nameToken}, we’ve missed you! Enjoy 30% off your next order if you return this week.`,
        reason: 'A compelling message for dormant customers.',
      },
    ],
    never: [
      {
        label: 'First order',
        message: `Hi ${nameToken}, thanks for checking us out! Enjoy 10% off your first order with code WELCOME10.`,
        reason: 'Perfect for customers who have not ordered yet.',
      },
    ],
  };

  const statusList = statusTemplates[insights.customerStatus] ?? [];
  const recommended = {
    label: 'Recommended',
    message: insights.recommendedMessage || statusList[0]?.message || `Hi ${nameToken}, thanks for visiting Crave & Co!`,
    reason: 'Best match based on this customer’s recent order behaviour.',
  };

  return [recommended, ...statusList];
}

// ─── Birthday Helpers ─────────────────────────────────────────────────────────

function parseBirthday(birthday?: string) {
  if (!birthday) return null;
  const date = new Date(birthday);
  return Number.isNaN(date.getTime()) ? null : date;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function BirthdayFields({ month, day, onMonth, onDay }: {
  month: string; day: string;
  onMonth: (v: string) => void; onDay: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-text-secondary">Birthday (optional)</label>
      <p className="text-xs text-text-tertiary">Just the day and month — we use this to celebrate with them!</p>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerCustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all');
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [birthdayFilter, setBirthdayFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sort, setSort] = useState<SortState | null>(null);
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [insightsCustomerId, setInsightsCustomerId] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLegend, setShowLegend] = useState(false);

  const customerSummaryData = [
    { label: 'New This Week', value: dashboard?.newThisWeek ?? 0 },
    { label: 'Active This Week', value: dashboard?.activeThisMonth ?? 0 },
    { label: 'At Risk', value: dashboard?.churnRisk ?? 0 },
  ];

  const customerHealthData = [
    { label: 'Total Customers', value: dashboard?.total ?? 0 },
    { label: 'Total Visits', value: dashboard?.totalVisits ?? 0 },
    { label: 'Total Spend', value: dashboard?.totalSpend ?? 0 },
  ];

  // SMS blast
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSms, setShowSms] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{ sent: number; failed: number; noPhone: string[]; error?: string } | null>(null);

  // Insight SMS composer
  const [insightsSmsMessage, setInsightsSmsMessage] = useState('');
  const [insightsSmsSending, setInsightsSmsSending] = useState(false);
  const [insightsSmsResult, setInsightsSmsResult] = useState<{ sent: number; failed: number; noPhone: string[]; error?: string } | null>(null);

  // Delete state
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!token || !deleteCustomer) return;
    setDeleting(true);
    setError('');
    try {
      await del(`/api/v1/customers/${deleteCustomer.id}`, token);
      setDeleteCustomer(null);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete customer'));
      setDeleteCustomer(null);
    } finally {
      setDeleting(false);
    }
  };

  // Create modal
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBirthdayMonth, setNewBirthdayMonth] = useState('');
  const [newBirthdayDay, setNewBirthdayDay] = useState('');

  // Edit modal
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthdayMonth, setEditBirthdayMonth] = useState('');
  const [editBirthdayDay, setEditBirthdayDay] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    const requestLimit = limit + 1;
    try {
      const [c, d] = await Promise.all([
        get(`${API_PATHS.customers.list}${buildQueryString({
          page,
          limit: requestLimit,
          search,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          hasPhone: phoneFilter === 'all' ? undefined : phoneFilter === 'yes' ? 'true' : 'false',
          hasEmail: emailFilter === 'all' ? undefined : emailFilter === 'yes' ? 'true' : 'false',
          hasBirthday: birthdayFilter === 'all' ? undefined : birthdayFilter === 'yes' ? 'true' : 'false',
          sortBy: sort?.key,
          sortDir: sort?.dir,
        })}`, token),
        get(API_PATHS.customers.dashboard, token),
      ]);
      const customerItems = Array.isArray(c) ? c : [];
      setHasMore(customerItems.length > limit);
      setCustomers(customerItems.slice(0, limit));
      setDashboard(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, search, statusFilter, phoneFilter, emailFilter, birthdayFilter, sort]);

  const loadCustomerInsights = async (customerId: string) => {
    if (!token) return;
    setInsightsCustomerId(customerId);
    setInsights(null);
    setInsightsError('');
    setInsightsLoading(true);

    try {
      const data = await get(API_PATHS.customers.insights(customerId), token);
      const insightData = data as CustomerInsights;
      setInsights(insightData);
      setInsightsSmsMessage(insightData.recommendedMessage || '');
      setInsightsSmsResult(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to load customer insights');
      console.error(err);
      setInsightsError(message);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  // Clear selection when list query changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, search, statusFilter, phoneFilter, emailFilter, birthdayFilter, sort]);

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone ?? '');
    setEditEmail(c.email ?? '');
    const bd = parseBirthday(c.birthday);
    if (bd) {
      setEditBirthdayMonth(String(bd.getMonth() + 1));
      setEditBirthdayDay(String(bd.getDate()));
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
      await post(API_PATHS.customers.list, {
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        birthday,
      }, token);
      setNewName(''); setNewPhone(''); setNewEmail(''); setNewBirthdayMonth(''); setNewBirthdayDay('');
      setShowNew(false);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create customer'));
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
          ? null
          : undefined;
      await patch(`/api/v1/customers/${editCustomer.id}`, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        ...(birthday !== undefined ? { birthday } : {}),
      }, token);
      closeEdit();
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update customer'));
    } finally {
      setSaving(false);
    }
  };

  const allOnPageSelected = customers.length > 0 && customers.every(c => selectedIds.has(c.id));
  const someOnPageSelected = customers.some(c => selectedIds.has(c.id));

  const orderMomentumData = insights ? [
    { label: '7d', orders: insights.ordersLast7Days },
    { label: '14d', orders: insights.ordersLast14Days },
    { label: '21d', orders: insights.ordersLast21Days },
  ] : [];

  const channelChartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const orderChannelData = insights?.channelBreakdown.map((entry) => ({ name: entry.channel, value: entry.count })) || [];

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  const closeInsights = () => {
    setInsightsCustomerId(null);
    setInsights(null);
    setInsightsError('');
    setInsightsLoading(false);
    setInsightsSmsMessage('');
    setInsightsSmsResult(null);
    setInsightsSmsSending(false);
  };

  const sendInsightSms = async () => {
    if (!token || !insightsCustomerId || !insightsSmsMessage.trim() || insightsSmsSending) return;
    setInsightsSmsSending(true);
    setInsightsSmsResult(null);

    try {
      const result = await post('/api/v1/customers/sms', {
        customerIds: [insightsCustomerId],
        message: insightsSmsMessage.trim(),
      }, token) as { sent: number; failed: number; noPhone: string[]; error?: string };
      setInsightsSmsResult(result);
    } catch (err: unknown) {
      setInsightsSmsResult({ sent: 0, failed: 1, noPhone: [], error: getErrorMessage(err, 'Failed to send SMS') });
    } finally {
      setInsightsSmsSending(false);
    }
  };

  // Selection helpers
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => { const next = new Set(prev); customers.forEach(c => next.delete(c.id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); customers.forEach(c => next.add(c.id)); return next; });
    }
  };

  const handleSendSms = async () => {
    if (!token || !smsMessage.trim() || smsSending) return;
    setSmsSending(true);
    try {
      const result = await post('/api/v1/customers/sms', {
        customerIds: Array.from(selectedIds),
        message: smsMessage.trim(),
      }, token) as { sent: number; failed: number; noPhone: string[] };
      setSmsResult(result);
    } catch (err: unknown) {
      setSmsResult({ sent: 0, failed: selectedIds.size, noPhone: [], error: getErrorMessage(err) });
    } finally {
      setSmsSending(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Users className="text-[var(--color-gold)]" /> Customers
        </h1>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <Button onClick={() => { setSmsResult(null); setShowSms(true); }}>
              <MessageSquare size={16} /> SMS ({selectedIds.size})
            </Button>
          )}
          <ExportButton
            filename="customers"
            sheets={[{
              name: 'Customers',
              data: customers,
              columns: [
                { header: 'Name', value: (c) => c.name },
                { header: 'Phone', value: (c) => c.phone ?? '' },
                { header: 'Email', value: (c) => c.email ?? '' },
                { header: 'Birthday', value: (c) => c.birthday ? new Date(c.birthday).toLocaleDateString('en-GH') : '' },
                { header: 'Visits', value: (c) => c.visitCount },
                { header: 'Total Spend (GHS)', value: (c) => Number(c.totalSpend) },
                { header: 'Loyalty Points', value: (c) => c.loyaltyPoints ?? 0 },
                { header: 'Total Discount (GHS)', value: (c) => Number(c.totalDiscount ?? 0) },
                { header: 'Last Seen', value: (c) => new Date(c.lastSeenAt).toLocaleDateString('en-GH') },
                { header: 'Joined', value: (c) => new Date(c.createdAt).toLocaleDateString('en-GH') },
              ],
            }]}
          />
          <Button onClick={() => setShowNew(true)}>
            <Plus size={16} /> Add Customer
          </Button>
        </div>
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

      {/* Legend toggle */}
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

      {dashboard && (
        <div className="rounded-3xl border border-border-subtle bg-surface-raised p-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Customer overview</p>
              <h2 className="text-lg font-semibold text-text-primary">Whole customer analytics</h2>
            </div>
            <div className="text-sm text-text-secondary">
              Updated from the latest customer dashboard summary.
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-3xl border border-border-subtle bg-white p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">Customer momentum</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerSummaryData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip formatter={(value: any, name: any) => [value, String(name)]} />
                    <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-white p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">Customer health</p>
              <div className="grid gap-3">
                {customerHealthData.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border-default bg-surface-base p-4">
                    <p className="text-xs text-text-secondary uppercase tracking-[0.28em] mb-2">{item.label}</p>
                    <p className="text-2xl font-semibold text-text-primary">
                      {item.label === 'Total Spend' ? formatCurrency(item.value) : item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(0);
                setSearch(searchInput.trim());
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-[var(--color-gold)] outline-none bg-surface-input"
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setPage(0);
            setSearch(searchInput.trim());
          }}
        >
          Search
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setPage(0);
            setSearchInput('');
            setSearch('');
          }}
        >
          Clear
        </Button>
      </div>

      {/* Backend Filters */}
      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={statusFilter}
            onChange={(e) => { setPage(0); setStatusFilter(e.target.value as 'all' | CustomerStatus); }}
            className="h-10 rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="loyal">Loyal</option>
            <option value="active">Active</option>
            <option value="fading">Fading</option>
            <option value="at-risk">At Risk</option>
            <option value="inactive">Inactive</option>
            <option value="never">No Visits</option>
          </select>

          <select
            value={phoneFilter}
            onChange={(e) => { setPage(0); setPhoneFilter(e.target.value as 'all' | 'yes' | 'no'); }}
            className="h-10 rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          >
            <option value="all">Phone: All</option>
            <option value="yes">Has Phone</option>
            <option value="no">No Phone</option>
          </select>

          <select
            value={emailFilter}
            onChange={(e) => { setPage(0); setEmailFilter(e.target.value as 'all' | 'yes' | 'no'); }}
            className="h-10 rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          >
            <option value="all">Email: All</option>
            <option value="yes">Has Email</option>
            <option value="no">No Email</option>
          </select>

          <select
            value={birthdayFilter}
            onChange={(e) => { setPage(0); setBirthdayFilter(e.target.value as 'all' | 'yes' | 'no'); }}
            className="h-10 rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          >
            <option value="all">Birthday: All</option>
            <option value="yes">Has Birthday</option>
            <option value="no">No Birthday</option>
          </select>

          <Button
            variant="ghost"
            onClick={() => {
              setPage(0);
              setStatusFilter('all');
              setPhoneFilter('all');
              setEmailFilter('all');
              setBirthdayFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-text-secondary">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border-default accent-[var(--color-gold)] cursor-pointer"
                        aria-label="Select all"
                        ref={el => { if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected; }}
                      />
                    </th>
                    <SortableHeader col="name" sort={sort} onToggle={toggleSort}>Name</SortableHeader>
                    <SortableHeader col="status" sort={sort} onToggle={toggleSort}>Status</SortableHeader>
                    <SortableHeader col="phone" sort={sort} onToggle={toggleSort}>Phone</SortableHeader>
                    <SortableHeader col="birthday" sort={sort} onToggle={toggleSort}>Birthday</SortableHeader>
                    <SortableHeader col="visitCount" sort={sort} onToggle={toggleSort} align="right">Visits</SortableHeader>
                    <SortableHeader col="loyaltyPoints" sort={sort} onToggle={toggleSort} align="right">Points</SortableHeader>
                    <SortableHeader col="totalDiscount" sort={sort} onToggle={toggleSort} align="right">Discounts</SortableHeader>
                    <SortableHeader col="totalSpend" sort={sort} onToggle={toggleSort} align="right">Total Spent</SortableHeader>
                    <SortableHeader col="lastSeenAt" sort={sort} onToggle={toggleSort}>Last Visit</SortableHeader>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className={`border-b last:border-0 hover:bg-surface-elevated/50 transition-colors ${selectedIds.has(c.id) ? 'bg-warning-muted/30' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="h-4 w-4 rounded border-border-default accent-[var(--color-gold)] cursor-pointer"
                          aria-label={`Select ${c.name}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                      <td className="px-4 py-3"><CustomerStatusBadge status={getCustomerStatus(c)} /></td>
                      <td className="px-4 py-3 text-text-secondary">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {(() => {
                          const bd = parseBirthday(c.birthday);
                          return bd ? (
                            <span className="flex items-center gap-1">
                              <Cake size={13} className="text-[var(--color-gold)]" />
                              {bd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          ) : '—';
                        })()}
                      </td>
                      <td className="px-4 py-3">{c.visitCount}</td>
                      <td className="px-4 py-3">{c.loyaltyPoints ?? 0}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(Number(c.totalDiscount || 0))}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(Number(c.totalSpend))}</td>
                      <td className="px-4 py-3 text-text-tertiary">{c.lastSeenAt ? formatDate(c.lastSeenAt) : '—'}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button
                          onClick={() => loadCustomerInsights(c.id)}
                          className="rounded-full px-3 py-2 text-xs font-semibold border border-border-subtle text-text-secondary hover:border-[var(--color-gold)] hover:text-text-primary transition-colors"
                          title="View insights"
                        >
                          Insights
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors"
                          title="Edit customer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteCustomer(c)}
                          className="p-1.5 rounded-lg hover:bg-error-muted text-text-tertiary hover:text-error transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
            <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-text-tertiary">No customers found</td></tr>
          )}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {customers.map((c) => (
          <div key={c.id} className={`rounded-2xl border border-border-subtle p-4 shadow-sm transition-colors ${selectedIds.has(c.id) ? 'bg-warning-muted/30' : 'bg-surface-raised'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="mt-1 h-4 w-4 rounded border-border-default accent-[var(--color-gold)] cursor-pointer shrink-0"
                  aria-label={`Select ${c.name}`}
                />
                <div>
                  <p className="font-semibold text-text-primary">{c.name}</p>
                  <div className="mt-1"><CustomerStatusBadge status={getCustomerStatus(c)} /></div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-[var(--color-gold)]">{formatCurrency(Number(c.totalSpend))}</span>
                <button
                  onClick={() => loadCustomerInsights(c.id)}
                  className="rounded-full px-3 py-2 text-xs font-semibold border border-border-subtle text-text-secondary hover:border-[var(--color-gold)] hover:text-text-primary transition-colors"
                >
                  Insights
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteCustomer(c)}
                  className="p-1.5 rounded-lg hover:bg-error-muted text-text-tertiary hover:text-error transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
              {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
              {(() => {
                const bd = parseBirthday(c.birthday);
                return bd ? (
                  <span className="flex items-center gap-1">
                    <Cake size={10} className="text-[var(--color-gold)]" />
                    {bd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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
        {customers.length === 0 && (
          <div className="text-center py-12 text-text-tertiary text-sm">No customers found</div>
        )}
      </div>

      <PaginationControls
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(value) => { setLimit(value); setPage(0); }}
        hasMore={hasMore}
      />

      {/* Insights Modal */}
      <Modal
        open={Boolean(insightsCustomerId)}
        onClose={closeInsights}
        title="Customer insights"
        description="Order pattern, preferences, and engagement recommendation."
        size="2xl"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={closeInsights}>Close</Button>
            <Button
              onClick={sendInsightSms}
              loading={insightsSmsSending}
              disabled={!insightsSmsMessage.trim()}
            >
              Send SMS
            </Button>
          </div>
        }
      >
        {insightsLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-text-secondary">Loading insights…</div>
        ) : insightsError ? (
          <div className="rounded-3xl border border-error/20 bg-error-muted p-4 text-sm text-error">{insightsError}</div>
        ) : insights ? (
          <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-3xl border border-border-subtle bg-surface-raised p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Customer</p>
                    <h3 className="mt-3 text-2xl font-semibold text-text-primary">{insights.customerName}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 rounded-full bg-surface-subtle px-3 py-2 text-text-secondary">Status: <span className="font-semibold text-text-primary">{insights.customerStatus}</span></span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-surface-subtle px-3 py-2 text-text-secondary">Preferred: <span className="font-semibold text-text-primary">{insights.preferredContact === 'sms' ? 'SMS' : insights.preferredContact === 'email' ? 'Email' : 'None'}</span></span>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-[var(--color-gold)]/10 p-4 text-[var(--color-gold)] self-start sm:self-auto">
                    <TrendingUp size={28} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InsightStat label="Total orders" value={String(insights.totalOrders)} note="Order history summary" />
                  <InsightStat label="Average order" value={formatCurrency(insights.averageOrderValue)} note="Average spend per visit" />
                  <InsightStat label="Last order" value={insights.lastOrderAt ? formatDate(insights.lastOrderAt) : 'None'} note="Most recent purchase" />
                  <InsightStat label="Days since" value={insights.daysSinceLastOrder !== null ? String(insights.daysSinceLastOrder) : '—'} note="How long since their last visit" />
                </div>
              </div>

              <div className="rounded-3xl border border-border-subtle bg-surface-raised p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">Engagement note</p>
                <div className="rounded-3xl border border-border-default bg-white p-4 shadow-sm">
                  <p className="text-sm leading-7 text-text-primary">{insights.recommendedMessage}</p>
                </div>
                <div className="mt-5 rounded-3xl bg-[var(--color-gold)]/10 p-4">
                  <p className="text-sm text-text-secondary">Best channel: <span className="font-semibold text-text-primary">{insights.preferredContact === 'sms' ? 'SMS' : insights.preferredContact === 'email' ? 'Email' : 'Any available channel'}</span></p>
                  <p className="mt-2 text-xs text-text-tertiary">Use this note to personalise your outreach, especially on their next order.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface-raised p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Send SMS</p>
                  <p className="mt-2 text-sm text-text-secondary">Send a personal message directly from this insight panel.</p>
                </div>
                <div className="rounded-full bg-surface-subtle px-3 py-1 text-xs text-text-secondary">Sends to: {insights.customerName}</div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {getCustomerSmsTemplates(insights).map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    onClick={() => setInsightsSmsMessage(template.message)}
                    className="rounded-3xl border border-border-default bg-white p-4 text-left hover:border-[var(--color-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
                  >
                    <p className="text-sm font-semibold text-text-primary">{template.label}</p>
                    <p className="mt-2 text-sm text-text-secondary">{template.reason}</p>
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-3xl border border-border-subtle bg-surface-base p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Message preview</p>
                      <p className="text-sm text-text-secondary mt-1">Personalization token: <span className="font-mono text-[var(--color-gold)]">{'{name}'}</span></p>
                    </div>
                    <span className={`text-xs ${insightsSmsMessage.length > 160 ? 'text-warning font-semibold' : 'text-text-secondary'}`}>{insightsSmsMessage.length} / 160</span>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={insightsSmsMessage}
                  onChange={(e) => setInsightsSmsMessage(e.target.value)}
                  placeholder="Select a suggested message or write your own…"
                  className="w-full rounded-3xl border border-border-default bg-white px-4 py-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] resize-none"
                />
                {insightsSmsResult && (
                  <div className={`rounded-3xl p-4 text-sm ${insightsSmsResult.sent > 0 ? 'bg-success-muted text-success border border-success/20' : 'bg-error-muted text-error border border-error/20'}`}>
                    {insightsSmsResult.sent > 0
                      ? `SMS sent successfully.`
                      : insightsSmsResult.error || 'Failed to send SMS.'}
                    {insightsSmsResult.noPhone.length > 0 ? ` ${insightsSmsResult.noPhone.length} phone number missing.` : ''}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-3xl border border-border-subtle bg-surface-raised p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Order momentum</p>
                  <p className="text-sm text-text-secondary">Recent activity breakdown</p>
                </div>
                <div className="mt-5 grid gap-3">
                  <InsightStat label="7-day orders" value={String(insights.ordersLast7Days)} />
                  <InsightStat label="14-day orders" value={String(insights.ordersLast14Days)} />
                  <InsightStat label="21-day orders" value={String(insights.ordersLast21Days)} />
                </div>
                <div className="mt-5 rounded-3xl border border-border-subtle bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">Order momentum</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderMomentumData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip formatter={(value: any) => [value, 'Orders']} />
                        <Bar dataKey="orders" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border-subtle bg-surface-raised p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">Preferred category</p>
                <p className="text-lg font-semibold text-text-primary">{insights.favoriteCategory || 'Unknown'}</p>
                <p className="mt-3 text-sm text-text-secondary">Top ordered items in the last 21 days.</p>
                <div className="mt-4 space-y-3">
                  {insights.topItems.map((item) => (
                    <div key={item.name} className="rounded-3xl border border-border-subtle bg-white p-3">
                      <div className="flex items-center justify-between gap-3 text-sm text-text-primary">
                        <span>{item.name}</span>
                        <span className="font-semibold text-text-secondary">{item.quantity}×</span>
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">{formatCurrency(item.spend)} total</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface-raised p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Channel mix</p>
                  <p className="mt-2 text-sm text-text-secondary">How this customer orders most often.</p>
                </div>
                <div className="rounded-full bg-surface-subtle px-3 py-1 text-xs text-text-secondary">Total {insights.channelBreakdown.reduce((acc, item) => acc + item.count, 0)} orders</div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-3">
                  {insights.channelBreakdown.map((entry) => (
                    <InsightProgress key={entry.channel} label={entry.channel} value={entry.sharePercent} />
                  ))}
                </div>
                <div className="rounded-3xl border border-border-subtle bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-text-secondary mb-3">Channel share</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderChannelData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={80}
                          paddingAngle={4}
                          stroke="none"
                        >
                          {orderChannelData.map((entry, index) => (
                            <Cell key={entry.name} fill={channelChartColors[index % channelChartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, 'Orders']} />
                        <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12, lineHeight: '14px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-text-secondary py-12">Select a customer to view insights.</div>
        )}
      </Modal>


      {/* ── Add Customer Modal ── */}
      {showNew && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Add Customer</h2>
                <p className="text-sm text-text-secondary mt-1">Create a new customer profile.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowNew(false); setError(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {error && <div className="mb-4 rounded-2xl bg-error-muted p-3 text-sm text-error">{error}</div>}
              <form id="new-customer-form" onSubmit={handleCreate} className="space-y-4">
                <Input label="Customer Name" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Kofi Mensah" />
                <Input label="Phone Number" type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="e.g. 024 000 0000" />
                <Input label="Email Address" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. kofi@email.com" />
                <BirthdayFields month={newBirthdayMonth} day={newBirthdayDay} onMonth={setNewBirthdayMonth} onDay={setNewBirthdayDay} />
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowNew(false); setError(''); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="new-customer-form" loading={saving}>Save Customer</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Customer Modal ── */}
      {!!editCustomer && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Edit Customer</h2>
                <p className="text-sm text-text-secondary mt-1">Update customer details.</p>
              </div>
              <Button variant="secondary" onClick={closeEdit}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {error && <div className="mb-4 rounded-2xl bg-error-muted p-3 text-sm text-error">{error}</div>}
              <form id="edit-customer-form" onSubmit={handleUpdate} className="space-y-4">
                <Input label="Customer Name" value={editName} onChange={e => setEditName(e.target.value)} required placeholder="e.g. Kofi Mensah" />
                <Input label="Phone Number" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="e.g. 024 000 0000" />
                <Input label="Email Address" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="e.g. kofi@email.com" />
                <BirthdayFields month={editBirthdayMonth} day={editBirthdayDay} onMonth={setEditBirthdayMonth} onDay={setEditBirthdayDay} />
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={closeEdit}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="edit-customer-form" loading={saving}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {!!deleteCustomer && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-center justify-center overflow-hidden bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-white shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-muted flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-error" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">Delete Customer</h2>
                <p className="text-sm text-text-secondary mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <span className="font-semibold text-text-primary">{deleteCustomer.name}</span>
              {deleteCustomer.phone ? ` (${deleteCustomer.phone})` : ''}? All associated data will be removed.
            </p>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteCustomer(null)} disabled={deleting}>Cancel</Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-error text-white font-semibold text-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {deleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS Modal ── */}
      {showSms && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border-subtle bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <MessageSquare size={20} className="text-[var(--color-gold)]" /> Send SMS
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              <Button variant="secondary" onClick={() => { setShowSms(false); setSmsResult(null); }}>Close</Button>
            </div>

            {smsResult ? (
              /* Result view */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                {smsResult.sent > 0 ? (
                  <div className="w-14 h-14 rounded-full bg-success-muted flex items-center justify-center">
                    <CheckSquare size={28} className="text-success" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-error-muted flex items-center justify-center">
                    <MessageSquare size={28} className="text-error" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-text-primary">
                    {smsResult.sent > 0 ? `${smsResult.sent} SMS sent!` : 'Could not send SMS'}
                  </p>
                  {smsResult.noPhone.length > 0 && (
                    <p className="text-sm text-text-secondary mt-1">
                      {smsResult.noPhone.length} customer{smsResult.noPhone.length !== 1 ? 's' : ''} skipped — no phone number
                    </p>
                  )}
                  {smsResult.failed > 0 && (
                    <p className="text-sm text-error mt-1">{smsResult.error ?? 'Delivery failed — please try again.'}</p>
                  )}
                </div>
                <div className="flex gap-3 mt-2">
                  <Button variant="secondary" onClick={() => { setSmsResult(null); setSmsMessage(''); setShowSms(false); setSelectedIds(new Set()); }}>
                    Done
                  </Button>
                  <Button onClick={() => { setSmsResult(null); setSmsMessage(''); }}>
                    Send Another
                  </Button>
                </div>
              </div>
            ) : (
              /* Compose view */
              <>
                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                  {/* Recipients summary */}
                  <div className="rounded-2xl bg-surface-elevated border border-border-subtle p-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Recipients</p>
                    <div className="flex flex-wrap gap-2">
                      {customers.filter(c => selectedIds.has(c.id)).map(c => (
                        <span key={c.id} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${c.phone ? 'bg-success-muted border-success/20 text-success' : 'bg-error-muted border-error/20 text-error'}`}>
                          {c.phone ? <Phone size={10} /> : null}
                          {c.name}
                          {!c.phone && <span className="opacity-70">· no phone</span>}
                        </span>
                      ))}
                      {(() => {
                        const offPage = selectedIds.size - customers.filter(c => selectedIds.has(c.id)).length;
                        return offPage > 0 ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-surface-raised border border-border-subtle text-text-tertiary">
                            +{offPage} more
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {customers.some(c => selectedIds.has(c.id) && !c.phone) && (
                      <p className="text-xs text-warning mt-2">⚠ Customers without a phone number will be skipped.</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-text-secondary">Message</label>
                      <span className={`text-xs ${smsMessage.length > 160 ? 'text-warning font-semibold' : 'text-text-tertiary'}`}>
                        {smsMessage.length} / 160{smsMessage.length > 160 ? ' (multiple SMS)' : ''}
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={smsMessage}
                      onChange={e => setSmsMessage(e.target.value)}
                      placeholder={`Hi {name}, thanks for visiting Crave & Co! 🍽️`}
                      className="w-full rounded-xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] resize-none"
                    />
                    <p className="text-xs text-text-tertiary">
                      Use <button type="button" onClick={() => setSmsMessage(m => m + '{name}')} className="font-mono text-[var(--color-gold)] hover:underline">{'{name}'}</button> to personalise — it will be replaced with each customer&apos;s name.
                    </p>
                  </div>
                </div>
                <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowSms(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleSendSms}
                    loading={smsSending}
                    disabled={!smsMessage.trim() || selectedIds.size === 0}
                  >
                    Send SMS
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
