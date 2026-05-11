'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatTime, formatCurrency, formatDateTime } from '@/lib/utils';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  CheckCircle,
  Package,
  Users,
  AlertTriangle,
  Lock,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface CommandCenterData {
  date: string;
  activeOrders: number;
  totalOrders: number;
  completedOrders: number;
  lowStockCount: number;
  staffOnDuty: number;
  openAlerts: number;
  customerOrders: number;
  customerRevenue: number;
  pendingPurchaseOrders: number;
  avgOrderValue: number;
  completionRate: number;
  lowStockPreview?: { name: string; onHand: number; reorderLevel: number }[];
  actionItems?: string[];
}

interface TimelineOrder {
  id: string;
  channel: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}

function StatTile({
  icon,
  label,
  value,
  helper,
  tone,
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
  }[tone ?? 'default'];

  const textColor = {
    green: 'text-success',
    yellow: 'text-warning',
    red: 'text-error',
    default: 'text-text-primary',
  }[tone ?? 'default'];

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${bg}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold ${textColor}`}>
        {icon}
        <span>{label}</span>
      </div>
      <p className={`min-w-0 text-3xl font-bold font-mono ${textColor} whitespace-normal break-words`}>{value}</p>
      {helper && <p className="text-xs text-text-secondary leading-snug">{helper}</p>}
    </div>
  );
}

export default function OpsDashboard() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [timeline, setTimeline] = useState<TimelineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'today' | 'week' | 'month'>('today');

  const dateRange = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (view === 'today') return { from: today, to: today };
    if (view === 'week') {
      const day = now.getDay();
      const offset = (day + 6) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - offset);
      return { from: start.toISOString().split('T')[0], to: today };
    }
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today };
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    const { from, to } = dateRange();
    try {
      const [cmd, tl] = await Promise.all([
        get(`/api/v1/ops/command-center?from=${from}&to=${to}`, token),
        get(`/api/v1/ops/service-timeline?from=${from}&to=${to}`, token),
      ]);
      setData(cmd);
      setTimeline(tl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, view]);

  const handleDayClose = () => {
    router.push('/ops/day-close');
  };

  if (loading) return <PageSkeleton />;

  const today = new Date().toLocaleDateString('en-GH', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const completionRate = data?.completionRate ?? 0;
  const activeOrders = data?.activeOrders ?? 0;
  const lowStock = data?.lowStockCount ?? 0;
  const openAlerts = data?.openAlerts ?? 0;

  const needsAttention: string[] = [];
  if (openAlerts > 0) needsAttention.push(`${openAlerts} unread alert${openAlerts > 1 ? 's' : ''} — check Alerts`);
  if (lowStock > 0) needsAttention.push(`${lowStock} item${lowStock > 1 ? 's' : ''} running low — check Inventory`);
  if ((data?.pendingPurchaseOrders ?? 0) > 0) needsAttention.push(`${data!.pendingPurchaseOrders} purchase request${data!.pendingPurchaseOrders > 1 ? 's' : ''} waiting — check Purchasing`);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Good morning 👋</h1>
          <p className="text-sm text-text-secondary mt-1">{today}</p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-surface-raised rounded-2xl p-1 w-fit">
          {(['today', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === v ? 'bg-gold text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {v === 'today' ? 'Today' : v === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Needs Attention banner */}
      {needsAttention.length > 0 && (
        <div className="rounded-2xl bg-warning-muted border border-warning/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-warning shrink-0" />
            <span className="font-semibold text-warning text-sm">Needs your attention</span>
          </div>
          <ul className="space-y-1">
            {needsAttention.map((item) => (
              <li key={item} className="text-sm text-text-primary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All-clear banner */}
      {needsAttention.length === 0 && (
        <div className="rounded-2xl bg-success-muted border border-success/30 p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-success shrink-0" />
          <span className="text-sm font-semibold text-success">Everything looks good — no issues right now!</span>
        </div>
      )}

      {/* Key Numbers */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary mb-3">Key Numbers</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={<ShoppingCart size={18} />}
            label="Active Orders"
            value={activeOrders}
            helper={activeOrders > 0 ? 'Orders still being prepared' : 'No active orders right now'}
            tone={activeOrders > 10 ? 'yellow' : 'default'}
          />
          <StatTile
            icon={<CheckCircle size={18} />}
            label="Completed"
            value={`${completionRate}%`}
            helper="Orders fully served"
            tone={completionRate >= 80 ? 'green' : 'yellow'}
          />
          <StatTile
            icon={<TrendingUp size={18} />}
            label="Revenue"
            value={formatCurrency(data?.customerRevenue ?? 0)}
            helper={view === 'today' ? 'Earned today' : view === 'week' ? 'Earned this week' : 'Earned this month'}
            tone="default"
          />
          <StatTile
            icon={<Users size={18} />}
            label="Staff on Duty"
            value={data?.staffOnDuty ?? 0}
            helper={(data?.staffOnDuty ?? 0) > 0 ? 'Currently clocked in' : 'No staff clocked in'}
            tone={(data?.staffOnDuty ?? 0) > 0 ? 'green' : 'yellow'}
          />
          <StatTile
            icon={<Package size={18} />}
            label="Low Stock Items"
            value={lowStock}
            helper={lowStock > 0 ? 'Ingredients below reorder level' : 'All stock levels okay'}
            tone={lowStock > 0 ? 'yellow' : 'green'}
          />
          <StatTile
            icon={<AlertTriangle size={18} />}
            label="Open Alerts"
            value={openAlerts}
            helper={openAlerts > 0 ? 'Issues that need your review' : 'No open issues'}
            tone={openAlerts > 0 ? 'red' : 'green'}
          />
          <StatTile
            icon={<ShoppingCart size={18} />}
            label="Total Orders"
            value={data?.totalOrders ?? 0}
            helper={view === 'today' ? 'Orders placed today' : view === 'week' ? 'Orders this week' : 'Orders this month'}
            tone="default"
          />
          <StatTile
            icon={<TrendingUp size={18} />}
            label="Avg. Order Value"
            value={formatCurrency(data?.avgOrderValue ?? 0)}
            helper="Average value per order"
            tone="default"
          />
        </div>
      </div>

      {/* Action Items from backend */}
      {(data?.actionItems?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary mb-3">Action Items</h2>
          <div className="space-y-2">
            {data!.actionItems!.map((item) => (
              <div key={item} className="rounded-2xl bg-surface-raised border border-border-subtle p-4 flex items-center gap-3">
                <AlertTriangle size={16} className="text-warning shrink-0" />
                <span className="text-sm text-text-primary flex-1">{item}</span>
                <span className="text-xs bg-warning-muted text-warning px-2 py-0.5 rounded-full font-semibold">Action needed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Recent Orders</h2>
          <a href="/ops/orders" className="text-xs text-gold font-semibold hover:underline">See all orders →</a>
        </div>
        {timeline.length === 0 ? (
          <div className="rounded-2xl bg-surface-raised border border-border-subtle p-8 text-center">
            <Clock size={32} className="mx-auto text-text-tertiary mb-2" />
            <p className="text-sm text-text-secondary">No orders yet {view === 'today' ? 'today' : 'in this period'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {timeline.slice(0, 8).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-surface-raised rounded-xl border border-border-subtle">
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-sm text-text-secondary capitalize">{order.channel.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-text-primary">{formatCurrency(order.total)}</span>
                  <span className="text-xs text-text-tertiary">{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
            ))}
            {timeline.length > 8 && (
              <p className="text-xs text-center text-text-tertiary pt-1">
                + {timeline.length - 8} more — <a href="/ops/orders" className="text-gold font-semibold hover:underline">view all</a>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Close Day */}
      <div className="rounded-2xl bg-surface-raised border border-border-subtle p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Lock size={16} className="text-text-secondary" />
              End of Day
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Count the cash, record the balance, and close today&apos;s operations.
            </p>
            <p className="text-xs text-warning font-medium mt-1">Only do this once, at the very end of the day.</p>
          </div>
          <Button
            variant="danger"
            onClick={handleDayClose}
            className="shrink-0"
          >
            <Lock size={16} />
            Close Day
          </Button>
        </div>
      </div>

    </div>
  );
}
