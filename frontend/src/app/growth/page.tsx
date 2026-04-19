'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  Users,
  UserPlus,
  UserX,
  Gift,
  Megaphone,
  MessageCircle,
  DollarSign,
  ShoppingCart,
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
  totalVisits: number;
  totalSpent: number;
  lastVisitAt: string;
}

export default function GrowthDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<GrowthDashboard | null>(null);
  const [churn, setChurn] = useState<ChurnCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangePreset, setRangePreset] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const formatISO = (date: Date) => date.toISOString().split('T')[0];

  const applyPreset = (preset: 'day' | 'week' | 'month' | 'year' | 'custom') => {
    const now = new Date();
    let from = new Date(now);
    let to = new Date(now);

    switch (preset) {
      case 'week': {
        const dayOfWeek = now.getDay();
        const mondayOffset = (dayOfWeek + 6) % 7;
        from.setDate(now.getDate() - mondayOffset);
        break;
      }
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
      case 'day':
      default:
        from = new Date(now);
        break;
    }

    setRangePreset(preset);
    setFromDate(formatISO(from));
    setToDate(formatISO(to));
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      get(`/api/v1/growth/dashboard?from=${fromDate}&to=${toDate}`, token),
      get('/api/v1/growth/churn-risk', token),
    ])
      .then(([d, c]) => {
        setData(d);
        setChurn(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, fromDate, toDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="text-gold" /> Growth & Retention Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {fromDate === toDate ? new Date(fromDate).toLocaleDateString('en-GH') : `${new Date(fromDate).toLocaleDateString('en-GH')} – ${new Date(toDate).toLocaleDateString('en-GH')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
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
        </div>
      </div>

      {/* Customer KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total Customers"
          value={data?.customers.total || 0}
          icon={<Users size={20} />}
        />
        <KPICard
          title="New This Week"
          value={data?.customers.newThisWeek || 0}
          icon={<UserPlus size={20} />}
          severity="healthy"
        />
        <KPICard
          title="Active This Month"
          value={data?.customers.activeThisMonth || 0}
          icon={<Users size={20} />}
          severity="healthy"
        />
        <KPICard
          title="Churn Risk"
          value={data?.customers.churnRisk || 0}
          icon={<UserX size={20} />}
          severity={(data?.customers.churnRisk || 0) > 5 ? 'critical' : 'warning'}
        />
        <KPICard
          title="Customer Visits"
          value={data?.customerVisits || 0}
          icon={<Users size={20} />}
        />
        <KPICard
          title="Customer Spend"
          value={data?.customerSpend || 0}
          isCurrency
          icon={<DollarSign size={20} />}
        />
        <KPICard
          title="Discounts Given"
          value={data?.loyalty?.totalDiscounts || 0}
          isCurrency
          icon={<DollarSign size={20} />}
          severity={(data?.loyalty?.totalDiscounts || 0) > 0 ? 'warning' : 'healthy'}
        />
        <KPICard
          title="Orders Processed"
          value={data?.ordersProcessed || 0}
          icon={<ShoppingCart size={20} />}
        />
      </div>

      {/* Loyalty & Campaigns Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loyalty Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift size={18} className="text-gold" /> Loyalty Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-success-muted rounded-xl">
              <span className="text-sm text-text-secondary">Points Issued</span>
              <span className="text-lg font-bold text-success">
                {(data?.loyalty?.totalPointsIssued || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gold-muted rounded-xl">
              <span className="text-sm text-text-secondary">Points Redeemed</span>
              <span className="text-lg font-bold text-gold">
                {(data?.loyalty?.totalPointsRedeemed || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-base rounded-xl">
              <span className="text-sm text-text-secondary">Redemption Rate</span>
              <span className="text-lg font-bold text-text-secondary">
                {data?.loyalty?.totalPointsIssued
                  ? ((data.loyalty.totalPointsRedeemed / data.loyalty.totalPointsIssued) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone size={18} className="text-gold" /> Recent Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.campaigns || data.campaigns.length === 0) ? (
              <p className="text-sm text-text-tertiary text-center py-4">No campaigns yet</p>
            ) : (
              <div className="space-y-3">
                {data.campaigns.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 bg-surface-base rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{c.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={c.status} />
                        <span className="text-xs text-text-tertiary">{c.type}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-text-secondary">
                      <p>Sent: {c.sentCount}</p>
                      <p>Opens: {c.openCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Churn Risk List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX size={18} className="text-error" /> Churn Risk Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {churn.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No churn risk customers — great job!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-text-secondary">
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Visits</th>
                    <th className="py-2 pr-4">Total Spent</th>
                    <th className="py-2">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {churn.slice(0, 10).map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-text-primary">{c.name}</td>
                      <td className="py-2 pr-4 text-text-secondary">{c.phone}</td>
                      <td className="py-2 pr-4">{c.totalVisits}</td>
                      <td className="py-2 pr-4">{formatCurrency(c.totalSpent)}</td>
                      <td className="py-2 text-text-tertiary">
                        {new Date(c.lastVisitAt).toLocaleDateString('en-GH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
