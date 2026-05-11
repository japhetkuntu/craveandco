'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, TrendingDown, ShoppingCart, Receipt, Utensils, DollarSign } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardTopItem {
  menuItemId: string;
  menuItem: { name: string };
  totalQuantity: number;
  _sum: Record<string, unknown>;
}

interface DashboardReport {
  date: string;
  totalSales: number;
  orderCount: number;
  averageTicket: number;
  totalExpenses: number;
  grossProfit: number;
  grossMarginPercent: number;
  expenseRatioPercent: number;
  topItems: DashboardTopItem[];
}

interface ReportSummaryResponse {
  periodStart: string;
  period: 'day' | 'week' | 'month' | 'year';
  totalSales: number;
  totalOrders: number;
  totalExpenses: number;
  grossProfit: number;
  days: { date: string; totalSales: number; orderCount: number; totalExpenses: number }[];
}

interface WeeklyDay {
  date: string;
  sales: number;
  orders: number;
  expenses: number;
}

export default function OwnerReportsPage() {
  const { token } = useAuth();
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');

  const formatTick = (value: string) => {
    const date = new Date(value);
    if (period === 'year') {
      return date.toLocaleDateString('en-GH', { month: 'short' });
    }
    if (period === 'month') {
      return date.toLocaleDateString('en-GH', { day: 'numeric' });
    }
    if (period === 'day') {
      return date.toLocaleTimeString('en-GH', { hour: 'numeric', minute: 'numeric' });
    }
    return date.toLocaleDateString('en-GH', { weekday: 'short' });
  };

  const formatLabel = (value: string) => {
    const date = new Date(value);
    if (period === 'year') {
      return date.toLocaleDateString('en-GH', { month: 'long' });
    }
    if (period === 'month') {
      return date.toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric' });
    }
    if (period === 'day') {
      return date.toLocaleTimeString('en-GH', { hour: 'numeric', minute: 'numeric' });
    }
    return date.toLocaleDateString('en-GH');
  };

  useEffect(() => {
    if (!token) return;

    setLoading(true);

    const todayStr = selectedDate;

    const dashboardRequest = get(API_PATHS.reports.dashboard(todayStr), token);
    const summaryRequest = get(API_PATHS.reports.summary(period, todayStr), token);

    Promise.all([dashboardRequest, summaryRequest])
      .then(([r, w]: [DashboardReport, ReportSummaryResponse]) => {
        setReport(r);
        setWeekly(
          (w.days ?? []).map((d) => ({
            date: d.date,
            sales: d.totalSales,
            orders: d.orderCount,
            expenses: d.totalExpenses,
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedDate, period]);

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="text-[var(--color-gold)]" /> Reports
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Sales and performance analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['day', 'week', 'month', 'year'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPeriod(v)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                period === v
                  ? 'bg-[var(--color-gold)] text-white shadow-sm'
                  : 'bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-full border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
          />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <TrendingUp size={18} />, label: 'Total Sales', value: formatCurrency(report?.totalSales || 0), tone: 'green' as const },
          { icon: <ShoppingCart size={18} />, label: 'Orders', value: report?.orderCount || 0, tone: undefined },
          { icon: <Receipt size={18} />, label: 'Avg Ticket', value: formatCurrency(report?.averageTicket || 0), tone: undefined },
          { icon: <Receipt size={18} />, label: 'Expenses', value: formatCurrency(report?.totalExpenses || 0), tone: 'yellow' as const },
        ].map(({ icon, label, value, tone }) => {
          const bg = tone === 'green' ? 'bg-success-muted border-success/30' : tone === 'yellow' ? 'bg-warning-muted border-warning/30' : 'bg-surface-raised border-border-subtle';
          const tv = tone === 'green' ? 'text-success' : tone === 'yellow' ? 'text-warning' : 'text-text-primary';
          return (
            <div key={label} className={`rounded-2xl border p-4 flex flex-col gap-2 ${bg}`}>
              <div className={`flex items-center gap-2 text-sm font-semibold ${tv}`}>{icon}<span>{label}</span></div>
              <p className={`text-3xl font-bold font-mono whitespace-normal break-words ${tv}`}>{value}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <DollarSign size={18} />, label: 'Gross Profit', value: formatCurrency(report?.grossProfit || 0), tone: (report?.grossProfit || 0) >= 0 ? 'green' as const : 'red' as const },
          { icon: <TrendingUp size={18} />, label: 'Gross Margin', value: `${report?.grossMarginPercent || 0}%`, tone: (report?.grossMarginPercent || 0) >= 30 ? 'green' as const : 'yellow' as const },
          { icon: <TrendingDown size={18} />, label: 'Expense Ratio', value: `${report?.expenseRatioPercent || 0}%`, tone: (report?.expenseRatioPercent || 0) < 40 ? 'green' as const : 'red' as const },
          { icon: <Utensils size={18} />, label: 'Top Items', value: report?.topItems?.length || 0, tone: undefined },
        ].map(({ icon, label, value, tone }) => {
          const bg = tone === 'green' ? 'bg-success-muted border-success/30' : tone === 'red' ? 'bg-error-muted border-error/30' : tone === 'yellow' ? 'bg-warning-muted border-warning/30' : 'bg-surface-raised border-border-subtle';
          const tv = tone === 'green' ? 'text-success' : tone === 'red' ? 'text-error' : tone === 'yellow' ? 'text-warning' : 'text-text-primary';
          return (
            <div key={label} className={`rounded-2xl border p-4 flex flex-col gap-2 ${bg}`}>
              <div className={`flex items-center gap-2 text-sm font-semibold ${tv}`}>{icon}<span>{label}</span></div>
              <p className={`text-3xl font-bold font-mono whitespace-normal break-words ${tv}`}>{value}</p>
            </div>
          );
        })}
      </div>

      {/* Sales Trend Chart */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Sales Trend</p>
        </div>
        <div className="p-4">
          {weekly.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTick}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => formatLabel(String(label))}
                />
                <Bar dataKey="sales" fill="#C9A646" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
          <Utensils size={14} className="text-[var(--color-gold)]" />
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Top Selling Items</p>
        </div>
        {(!report?.topItems || report.topItems.length === 0) ? (
          <p className="text-sm text-text-tertiary text-center py-10">No data yet</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {report.topItems.map((item, i) => (
              <div key={item.menuItemId ?? i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--color-gold)] w-6 text-center">{i + 1}</span>
                  <span className="text-sm font-medium text-text-primary">{item.menuItem?.name ?? 'Unknown'}</span>
                </div>
                <p className="text-xs text-text-secondary font-mono">{item.totalQuantity} sold</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
