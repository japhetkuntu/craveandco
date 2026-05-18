'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PageSkeleton } from '@/components/ui/skeleton';
import { API_PATHS } from '@/lib/constants';
import {
  TrendingUp,
  Users,
  UserPlus,
  UserX,
  Gift,
  Megaphone,
  DollarSign,
  ShoppingCart,
  Cake,
  Tag,
  Percent,
} from 'lucide-react';

interface GrowthDashboard {
  customers: {
    total: number;
    newThisWeek: number;
    activeThisMonth: number;
    churnRisk: number;
  };
  customerVisits: number;
  customerSpend: number;
  loyalty: {
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalDiscounts?: number;
  };
  ordersProcessed: number;
  campaigns: {
    id: string;
    name: string;
    status: string;
    type: string;
    sentCount: number;
    openCount: number;
  }[];
}

interface ChurnCustomer {
  id: string;
  name: string;
  phone: string;
  visitCount?: number;
  totalVisits?: number;
  totalSpend?: number;
  totalSpent?: number;
  lastSeenAt?: string;
  lastVisitAt?: string;
}

interface BirthdayCustomer {
  id: string;
  name: string;
  phone?: string;
  birthday: string;
  daysUntil: number;
}

interface Promotion {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  status: string;
  usageCount: number;
  totalDiscount: number;
  endDate?: string;
}

function StatTile({
  icon,
  label,
  value,
  helper,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'green' | 'yellow' | 'red' | 'default';
}) {
  const bg = {
    green: 'bg-success-muted border-success/30',
    yellow: 'bg-warning-muted border-warning/30',
    red: 'bg-error-muted border-error/30',
    default: 'bg-surface-raised border-border-subtle',
  }[tone];
  const textColor = {
    green: 'text-success',
    yellow: 'text-warning',
    red: 'text-error',
    default: 'text-text-primary',
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${bg}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold ${textColor}`}>
        {icon}
        <span>{label}</span>
      </div>
      <span className={`min-w-0 text-3xl font-bold font-mono ${textColor} whitespace-normal break-words`}>{value}</span>
      {helper && <span className="text-xs text-text-tertiary">{helper}</span>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.6875rem] font-semibold text-text-secondary uppercase tracking-widest">
      {children}
    </p>
  );
}

export default function GrowthDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<GrowthDashboard | null>(null);
  const [churn, setChurn] = useState<ChurnCustomer[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayCustomer[]>([]);
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangePreset, setRangePreset] = useState<'day' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const formatISO = (date: Date) => date.toISOString().split('T')[0];

  const applyPreset = (preset: typeof rangePreset) => {
    const now = new Date();
    let from = new Date(now);
    const to = new Date(now);
    switch (preset) {
      case 'week': {
        const monday = (now.getDay() + 6) % 7;
        from.setDate(now.getDate() - monday);
        break;
      }
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
      case 'yesterday': {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        from = y;
        to.setDate(now.getDate() - 1);
        break;
      }
      default:
        from = new Date(now);
    }
    setRangePreset(preset);
    if (preset !== 'custom') {
      setFromDate(formatISO(from));
      setToDate(formatISO(to));
    }
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      get(`${API_PATHS.growth.dashboard}?from=${fromDate}&to=${toDate}`, token),
      get(API_PATHS.growth.churnRisk, token),
      get(API_PATHS.customers.upcomingBirthdays, token),
      get(API_PATHS.promotions.active, token),
    ])
      .then(([d, c, b, p]) => {
        setData(d);
        setChurn(c);
        setBirthdays(b);
        setActivePromos(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, fromDate, toDate]);

  if (loading) return <PageSkeleton />;

  const redemptionRate = data?.loyalty?.totalPointsIssued
    ? ((data.loyalty.totalPointsRedeemed / data.loyalty.totalPointsIssued) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp size={22} className="text-[var(--color-gold)]" />
            Growth Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {fromDate === toDate
              ? new Date(fromDate + 'T12:00:00').toLocaleDateString('en-GH', { dateStyle: 'long' })
              : `${new Date(fromDate + 'T12:00:00').toLocaleDateString('en-GH', { dateStyle: 'medium' })} – ${new Date(toDate + 'T12:00:00').toLocaleDateString('en-GH', { dateStyle: 'medium' })}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {(['day', 'yesterday', 'week', 'month', 'year', 'custom'] as const).map((preset) => (
            <Button
              key={preset}
              variant={rangePreset === preset ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset === 'day' ? 'Today' : preset === 'yesterday' ? 'Yesterday' : preset === 'week' ? 'This Week' : preset === 'month' ? 'This Month' : preset === 'year' ? 'This Year' : 'Custom Range'}
            </Button>
          ))}
          {rangePreset === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-secondary px-1">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-secondary px-1">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Stats */}
      <section className="space-y-3">
        <SectionTitle>Customer Overview</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon={<Users size={16} />} label="Total Customers" value={data?.customers.total || 0} />
          <StatTile
            icon={<UserPlus size={16} />}
            label="New This Week"
            value={data?.customers.newThisWeek || 0}
            tone={data?.customers.newThisWeek ? 'green' : 'default'}
          />
          <StatTile
            icon={<Users size={16} />}
            label="Active (30 days)"
            value={data?.customers.activeThisMonth || 0}
            tone="green"
          />
          <StatTile
            icon={<UserX size={16} />}
            label="At Risk"
            value={data?.customers.churnRisk || 0}
            tone={(data?.customers.churnRisk || 0) > 3 ? 'red' : 'default'}
          />
        </div>
      </section>

      {/* Activity Stats */}
      <section className="space-y-3">
        <SectionTitle>Period Activity</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon={<ShoppingCart size={16} />} label="Orders" value={data?.ordersProcessed || 0} />
          <StatTile
            icon={<Users size={16} />}
            label="Customer Visits"
            value={data?.customerVisits || 0}
            tone={data?.customerVisits ? 'green' : 'default'}
          />
          <StatTile
            icon={<DollarSign size={16} />}
            label="Revenue"
            value={formatCurrency(data?.customerSpend || 0)}
            tone="green"
          />
          <StatTile
            icon={<Gift size={16} />}
            label="Loyalty Discounts"
            value={formatCurrency(data?.loyalty?.totalDiscounts || 0)}
            tone={(data?.loyalty?.totalDiscounts || 0) > 0 ? 'yellow' : 'default'}
          />
        </div>
      </section>

      {/* Upcoming Birthdays */}
      {birthdays.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Upcoming Birthdays (Next 7 Days)</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {birthdays.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--color-gold)]/30 bg-warning-muted p-3"
              >
                <div className="rounded-xl bg-[var(--color-gold)]/20 p-2.5">
                  <Cake size={18} className="text-[var(--color-gold)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{b.name}</p>
                  <p className="text-xs text-text-secondary">
                    {new Date(b.birthday + 'T12:00:00').toLocaleDateString('en-GH', { day: 'numeric', month: 'long' })}
                    {b.phone && <span className="ml-2 text-text-tertiary">{b.phone}</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-lg font-bold font-mono text-[var(--color-gold)]">
                    {b.daysUntil === 0 ? '🎂' : `${b.daysUntil}d`}
                  </span>
                  {b.daysUntil > 0 && <p className="text-xs text-text-tertiary">away</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Promotions */}
      {activePromos.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Active Promotions</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePromos.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-success/30 bg-success-muted p-4 flex items-center gap-3"
              >
                <div className="rounded-xl bg-success/20 p-2.5 shrink-0">
                  {p.type === 'PERCENTAGE' ? (
                    <Percent size={18} className="text-success" />
                  ) : (
                    <Tag size={18} className="text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">{p.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {p.type === 'PERCENTAGE' ? `${p.value}% off` : `${formatCurrency(p.value)} off`}
                    {p.endDate && ` · until ${new Date(p.endDate + 'T12:00:00').toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-bold font-mono text-success">{p.usageCount}</span>
                  <p className="text-xs text-text-tertiary">uses</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Loyalty + Campaigns */}
      <section className="space-y-3">
        <SectionTitle>Loyalty & Campaigns</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Loyalty */}
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Gift size={16} className="text-[var(--color-gold)]" />
              <span>Loyalty Overview</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Points Issued', value: (data?.loyalty?.totalPointsIssued || 0).toLocaleString(), tone: 'green' as const },
                { label: 'Points Redeemed', value: (data?.loyalty?.totalPointsRedeemed || 0).toLocaleString(), tone: 'yellow' as const },
                { label: 'Redemption Rate', value: `${redemptionRate}%`, tone: 'default' as const },
              ].map(({ label, value, tone }) => {
                const bg = tone === 'green' ? 'bg-success-muted' : tone === 'yellow' ? 'bg-warning-muted' : 'bg-surface-base';
                const tv = tone === 'green' ? 'text-success' : tone === 'yellow' ? 'text-warning' : 'text-text-secondary';
                return (
                  <div key={label} className={`flex justify-between items-center p-3 rounded-xl ${bg}`}>
                    <span className="text-sm text-text-secondary">{label}</span>
                    <span className={`text-lg font-bold font-mono ${tv}`}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Megaphone size={16} className="text-[var(--color-gold)]" />
              <span>Recent Campaigns</span>
            </div>
            {(!data?.campaigns || data.campaigns.length === 0) ? (
              <div className="text-center py-6 text-sm text-text-tertiary">No campaigns yet</div>
            ) : (
              <div className="space-y-2">
                {data.campaigns.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-surface-base rounded-xl gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={c.status} />
                        <span className="text-xs text-text-tertiary capitalize">{c.type.replace(/_/g, ' ').toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-text-secondary shrink-0">
                      <p>Sent: <span className="font-semibold text-text-primary">{c.sentCount}</span></p>
                      <p>Opens: <span className="font-semibold text-text-primary">{c.openCount}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Churn Risk */}
      <section className="space-y-3">
        <SectionTitle>Churn Risk</SectionTitle>
        {churn.length === 0 ? (
          <div className="rounded-2xl border border-success/30 bg-success-muted p-8 text-center">
            <UserX size={32} className="mx-auto mb-2 text-success opacity-60" />
            <p className="font-semibold text-success">No customers at risk — great job!</p>
            <p className="text-sm text-text-secondary mt-1">All regulars are still coming back.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {churn.slice(0, 8).map((c) => {
              const lastVisit = c.lastSeenAt || c.lastVisitAt || '';
              const daysSince = lastVisit
                ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400000)
                : null;
              return (
                <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface-raised p-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{c.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-text-secondary">
                      {c.phone && <span>{c.phone}</span>}
                      <span>{(c.visitCount ?? c.totalVisits ?? 0)} visits</span>
                      <span>{formatCurrency(c.totalSpend ?? c.totalSpent ?? 0)} spent</span>
                    </div>
                  </div>
                  {daysSince !== null && (
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold font-mono text-error">{daysSince}d</span>
                      <p className="text-xs text-text-tertiary">inactive</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
