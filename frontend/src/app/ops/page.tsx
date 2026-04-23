'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  ShoppingCart,
  CheckCircle,
  Package,
  Users,
  AlertTriangle,
  Lock,
  DollarSign,
  Truck,
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

export default function OpsCommandCenter() {
  const { token } = useAuth();
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [timeline, setTimeline] = useState<TimelineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [dayCloseSuccess, setDayCloseSuccess] = useState(false);
  const [dayCloseMessage, setDayCloseMessage] = useState<string | null>(null);
  const [rangePreset, setRangePreset] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const formatISO = (date: Date) => date.toISOString().split('T')[0];

  const applyPreset = (preset: 'day' | 'week' | 'month' | 'year' | 'custom') => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (preset) {
      case 'week': {
        const dayOfWeek = now.getDay();
        const mondayOffset = (dayOfWeek + 6) % 7;
        start.setDate(now.getDate() - mondayOffset);
        break;
      }
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'day':
      default:
        start = new Date(now);
        break;
    }

    setRangePreset(preset);
    setFromDate(formatISO(start));
    setToDate(formatISO(end));
  };

  const fetchCommandCenter = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cmd, tl] = await Promise.all([
        get(`/api/v1/ops/command-center?from=${fromDate}&to=${toDate}`, token),
        get(`/api/v1/ops/service-timeline?from=${fromDate}&to=${toDate}`, token),
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
    fetchCommandCenter();
  }, [token, fromDate, toDate]);

  const handleDayClose = async () => {
    if (!token) return;
    setClosing(true);
    setDayCloseMessage(null);
    try {
      await post('/api/v1/ops/day-close', {}, token);
      setDayCloseSuccess(true);
      setDayCloseMessage('Day close completed successfully. Review the ops day-close report for details.');
      await fetchCommandCenter();
    } catch (err) {
      console.error(err);
      setDayCloseMessage('Unable to close the day. Please try again.');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <LayoutDashboard className="text-gold" /> Operations Command Center
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {fromDate === toDate ? new Date(fromDate).toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' }) : `${new Date(fromDate).toLocaleDateString('en-GH')} – ${new Date(toDate).toLocaleDateString('en-GH')}`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year', 'custom'] as const).map((preset) => (
              <Button
                key={preset}
                variant={rangePreset === preset ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => applyPreset(preset)}
              >
                {preset === 'day' ? 'Day' : preset === 'week' ? 'Week' : preset === 'month' ? 'Month' : preset === 'year' ? 'Year' : 'Custom'}
              </Button>
            ))}
          </div>
          {rangePreset === 'custom' && (
            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-sm text-text-secondary">
                From
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="ml-2 rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none"
                />
              </label>
              <label className="text-sm text-text-secondary">
                To
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="ml-2 rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none"
                />
              </label>
            </div>
          )}
          <Button variant="danger" onClick={handleDayClose} loading={closing} disabled={closing || dayCloseSuccess}>
            <Lock size={16} /> Close Day
          </Button>
        </div>
      </div>
      {dayCloseMessage ? (
        <div className={`rounded-3xl p-4 ${dayCloseSuccess ? 'bg-success-muted text-success' : 'bg-error-muted text-error'}`}>
          {dayCloseMessage}
        </div>
      ) : null}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Orders"
          value={data?.activeOrders || 0}
          icon={<ShoppingCart size={20} />}
          severity={(data?.activeOrders || 0) > 10 ? 'warning' : 'healthy'}
        />
        <KPICard
          title="Total Orders"
          value={data?.totalOrders || 0}
          icon={<ShoppingCart size={20} />}
        />
        <KPICard
          title="Avg Order Value"
          value={data?.avgOrderValue || 0}
          isCurrency
          icon={<DollarSign size={20} />}
        />
        <KPICard
          title="Completion Rate"
          value={`${data?.completionRate || 0}%`}
          icon={<CheckCircle size={20} />}
          severity={(data?.completionRate || 0) >= 80 ? 'healthy' : 'warning'}
        />
        <KPICard
          title="Low Stock Items"
          value={data?.lowStockCount || 0}
          icon={<Package size={20} />}
          severity={(data?.lowStockCount || 0) > 0 ? 'warning' : 'healthy'}
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Customer Orders"
          value={data?.customerOrders || 0}
          icon={<Users size={20} />}
          severity={(data?.customerOrders || 0) > 10 ? 'warning' : 'healthy'}
        />
        <KPICard
          title="Revenue Today"
          value={data?.customerRevenue || 0}
          isCurrency
          icon={<DollarSign size={20} />}
        />
        <KPICard
          title="Purchase Requests"
          value={data?.pendingPurchaseOrders || 0}
          icon={<Truck size={20} />}
          severity={(data?.pendingPurchaseOrders || 0) > 0 ? 'warning' : 'healthy'}
        />
        <KPICard
          title="Staff On Duty"
          value={data?.staffOnDuty || 0}
          icon={<Users size={20} />}
          severity={(data?.staffOnDuty || 0) > 0 ? 'healthy' : 'warning'}
        />
      </div>

      {/* Service Timeline */}
      {data?.actionItems?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Command Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.actionItems.map((item) => (
                <div key={item} className="rounded-3xl bg-surface-base p-4 flex items-center justify-between gap-4">
                  <span className="text-sm text-text-primary">{item}</span>
                  <span className="text-xs text-text-secondary">Action required</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Service Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4 text-center">No orders today yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timeline.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-surface-base rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm text-text-secondary">{order.channel}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-text-primary">
                      GH₵ {Number(order.total).toFixed(2)}
                    </span>
                    <span className="text-xs text-text-tertiary">{formatTime(order.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
