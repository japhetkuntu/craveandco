'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-gold" />
          <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-3xl border border-border-default bg-surface-raised px-4 py-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Period</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {['day', 'week', 'month', 'year'].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setPeriod(value as 'day' | 'week' | 'month' | 'year')}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    period === value ? 'bg-gold text-white' : 'bg-surface-base text-text-secondary hover:bg-surface-elevated'
                  }`}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <label className="rounded-3xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-secondary">
            Date
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border-default bg-white px-3 py-2 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
            />
          </label>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Sales" value={formatCurrency(report?.totalSales || 0)} icon={<TrendingUp size={20} />} severity="healthy" />
        <KPICard title="Orders" value={report?.orderCount || 0} icon={<ShoppingCart size={20} />} />
        <KPICard title="Avg Ticket" value={formatCurrency(report?.averageTicket || 0)} icon={<Receipt size={20} />} />
        <KPICard title="Expenses" value={formatCurrency(report?.totalExpenses || 0)} icon={<Receipt size={20} />} severity="warning" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Gross Profit" value={formatCurrency(report?.grossProfit || 0)} icon={<DollarSign size={20} />} severity={(report?.grossProfit || 0) >= 0 ? 'healthy' : 'critical'} />
        <KPICard title="Gross Margin" value={`${report?.grossMarginPercent || 0}%`} icon={<TrendingUp size={20} />} severity={(report?.grossMarginPercent || 0) >= 30 ? 'healthy' : (report?.grossMarginPercent || 0) > 10 ? 'warning' : 'critical'} />
        <KPICard title="Expense Ratio" value={`${report?.expenseRatioPercent || 0}%`} icon={<TrendingDown size={20} />} severity={(report?.expenseRatioPercent || 0) < 40 ? 'healthy' : (report?.expenseRatioPercent || 0) < 60 ? 'warning' : 'critical'} />
        <KPICard title="Top Items" value={report?.topItems?.length || 0} icon={<Utensils size={20} />} />
      </div>

      {/* Weekly Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
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
                <Bar dataKey="sales" fill="#ea580c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils size={18} className="text-gold" /> Top Selling Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!report?.topItems || report.topItems.length === 0) ? (
            <p className="text-sm text-text-tertiary text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {report.topItems.map((item, i) => (
                <div
                  key={item.menuItemId ?? i}
                  className="flex items-center justify-between p-3 bg-surface-base rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gold w-6 text-center">{i + 1}</span>
                    <span className="text-sm font-medium text-text-primary">{item.menuItem?.name ?? 'Unknown'}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">{item.totalQuantity} sold</p>
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
