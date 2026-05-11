'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { API_PATHS } from '@/lib/constants';
import {
  Tag,
  Percent,
  DollarSign,
  TrendingDown,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

interface PromotionAnalytics {
  id: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  usageCount: number;
  totalDiscount: number;
  periodOrders: number;
  periodRevenue: number;
  periodDiscount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'cancelled',
};

const today = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

function StatTile({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
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
    </div>
  );
}

export default function GrowthPromotionsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<PromotionAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await get(API_PATHS.promotions.analytics(from, to), token);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token, from, to]);

  const activePromos = analytics.filter(p => p.status === 'ACTIVE');
  const totalPeriodOrders = analytics.reduce((s, p) => s + p.periodOrders, 0);
  const totalPeriodRevenue = analytics.reduce((s, p) => s + p.periodRevenue, 0);
  const totalPeriodDiscount = analytics.reduce((s, p) => s + p.periodDiscount, 0);
  const totalAllTimeDiscount = analytics.reduce((s, p) => s + p.totalDiscount, 0);

  if (loading) return <PageSkeleton />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Tag size={22} className="text-[var(--color-gold)]" />
          Promotions
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Track promotion performance and traffic
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-surface-raised border border-border-subtle">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">From</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="h-11 w-full rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">To</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="h-11 w-full rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          />
        </div>
        <div className="flex items-end gap-2">
          {[
            { label: 'Today', from: today, to: today },
            { label: 'This Month', from: monthStart, to: today },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => { setFrom(preset.from); setTo(preset.to); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                from === preset.from && to === preset.to
                  ? 'bg-[var(--color-gold)] text-black border-transparent'
                  : 'bg-surface-input border-border-subtle text-text-secondary'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={<Tag size={16} />}
          label="Active Now"
          value={activePromos.length}
          tone={activePromos.length > 0 ? 'green' : 'default'}
        />
        <StatTile
          icon={<ShoppingBag size={16} />}
          label="Orders (Period)"
          value={totalPeriodOrders}
        />
        <StatTile
          icon={<TrendingDown size={16} />}
          label="Discount (Period)"
          value={formatCurrency(totalPeriodDiscount)}
          tone={totalPeriodDiscount > 0 ? 'yellow' : 'default'}
        />
        <StatTile
          icon={<DollarSign size={16} />}
          label="Revenue (Period)"
          value={formatCurrency(totalPeriodRevenue)}
          tone="green"
        />
      </div>

      {/* Promotions List */}
      {analytics.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-10 text-center">
          <Tag size={32} className="mx-auto mb-3 text-text-tertiary" />
          <p className="font-semibold text-text-primary">No promotions set up yet</p>
          <p className="text-sm text-text-secondary mt-1">
            The owner can create promotions from the Promotions settings page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-semibold text-text-secondary uppercase tracking-widest">
            All Promotions
          </p>
          {analytics.map(promo => (
            <div
              key={promo.id}
              className="rounded-2xl border border-border-subtle bg-surface-raised p-4 flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text-primary truncate">{promo.name}</span>
                    <StatusBadge status={STATUS_LABELS[promo.status] || 'draft'} />
                  </div>
                  {promo.description && (
                    <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{promo.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {promo.type === 'PERCENTAGE' ? (
                    <Percent size={14} className="text-[var(--color-gold)]" />
                  ) : (
                    <DollarSign size={14} className="text-[var(--color-gold)]" />
                  )}
                  <span className="text-base font-bold text-text-primary font-mono">
                    {promo.type === 'PERCENTAGE' ? `${promo.value}%` : formatCurrency(promo.value)}
                  </span>
                </div>
              </div>

              {/* Dates */}
              {(promo.startDate || promo.endDate) && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Calendar size={12} />
                  {promo.startDate && <span>From {new Date(promo.startDate).toLocaleDateString()}</span>}
                  {promo.endDate && <span>until {new Date(promo.endDate).toLocaleDateString()}</span>}
                </div>
              )}

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-border-subtle">
                {[
                  { label: 'Total Uses', value: promo.usageCount },
                  { label: 'Period Orders', value: promo.periodOrders },
                  { label: 'Period Discount', value: formatCurrency(promo.periodDiscount) },
                  { label: 'All-Time Discount', value: formatCurrency(promo.totalDiscount) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[0.6rem] font-semibold text-text-tertiary uppercase tracking-widest">{label}</span>
                    <span className="text-base font-bold font-mono text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
