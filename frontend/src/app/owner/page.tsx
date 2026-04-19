'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';

interface DashboardData {
  date: string;
  salesToday: number;
  ordersToday: number;
  averageTicket: number;
  expensesToday: number;
  grossEstimate: number;
  grossMarginPercent: number;
  expenseRatioPercent: number;
  profitPerOrder: number;
  expensePerOrder: number;
  customerOrdersToday: number;
  customerRevenueToday: number;
  customerRevenueSharePercent: number;
  customerOrderRatePercent: number;
  ordersWithoutCustomer: number;
  discountsGiven: number;
  lowStockAlerts: number;
  openAlerts: number;
  pendingApprovals: number;
}

interface PurchaseOrderItem {
  id: string;
  ingredient: { name: string };
  quantity: number;
  unitCost: number;
  receivedQty: number;
}

interface PurchaseOrder {
  id: string;
  supplier: { name: string };
  status: string;
  totalAmount: number;
  orderedAt: string;
  receivedAt?: string;
  notes?: string;
  items: PurchaseOrderItem[];
}

interface Approval {
  id: string;
  category: string;
  amount: number;
  description?: string;
  user: { name: string };
  paidAt: string;
}

export default function OwnerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalPage, setApprovalPage] = useState(0);
  const [approvalLimit, setApprovalLimit] = useState(10);
  const [approvalsHasMore, setApprovalsHasMore] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseOrdersPage, setPurchaseOrdersPage] = useState(0);
  const [purchaseOrdersLimit, setPurchaseOrdersLimit] = useState(5);
  const [purchaseOrdersHasMore, setPurchaseOrdersHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rangePreset, setRangePreset] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
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
      get(`/api/v1/owner/dashboard?from=${fromDate}&to=${toDate}`, token),
      get(`/api/v1/owner/approvals/pending?page=${approvalPage}&limit=${approvalLimit}`, token),
      get(`/api/v1/purchase-orders?page=${purchaseOrdersPage}&limit=${purchaseOrdersLimit}`, token),
    ])
      .then(([dash, apps, purchaseOrders]) => {
        setData(dash);
        setApprovals(apps);
        setApprovalsHasMore(apps.length === approvalLimit);
        setPurchaseOrders(purchaseOrders);
        setPurchaseOrdersHasMore(purchaseOrders.length === purchaseOrdersLimit);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, fromDate, toDate, approvalPage, approvalLimit, purchaseOrdersPage, purchaseOrdersLimit]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      await post(`/api/v1/owner/approvals/${id}/approve`, {}, token);
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setData((d) => d ? { ...d, pendingApprovals: d.pendingApprovals - 1 } : d);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    try {
      await post(`/api/v1/owner/approvals/${id}/reject`, {}, token);
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setData((d) => d ? { ...d, pendingApprovals: d.pendingApprovals - 1 } : d);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceivePurchaseOrder = async (po: PurchaseOrder) => {
    if (!token) return;
    try {
      await post(`/api/v1/purchase-orders/${po.id}/receive`, {
        items: po.items.map((item) => ({
          purchaseOrderItemId: item.id,
          receivedQty: item.quantity,
        })),
      }, token);
      setPurchaseOrders((prev) =>
        prev.map((order) =>
          order.id === po.id ? { ...order, status: 'RECEIVED', receivedAt: new Date().toISOString() } : order,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

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
          <h1 className="text-2xl font-bold text-text-primary">Owner Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            {fromDate === toDate ? new Date(fromDate).toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : `${new Date(fromDate).toLocaleDateString('en-GH')} – ${new Date(toDate).toLocaleDateString('en-GH')}`}
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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Sales Today"
          value={data?.salesToday || 0}
          isCurrency
          icon={<DollarSign size={20} />}
          severity="healthy"
        />
        <KPICard
          title="Orders"
          value={data?.ordersToday || 0}
          icon={<ShoppingCart size={20} />}
        />
        <KPICard
          title="Avg Ticket"
          value={data?.averageTicket || 0}
          isCurrency
          icon={<TrendingUp size={20} />}
        />
        <KPICard
          title="Gross Estimate"
          value={data?.grossEstimate || 0}
          isCurrency
          icon={<DollarSign size={20} />}
          severity={
            (data?.grossEstimate || 0) > 0 ? 'healthy' : 'critical'
          }
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Gross Margin"
          value={`${data?.grossMarginPercent || 0}%`}
          icon={<TrendingUp size={20} />}
          severity={(data?.grossMarginPercent || 0) >= 30 ? 'healthy' : (data?.grossMarginPercent || 0) > 10 ? 'warning' : 'critical'}
        />
        <KPICard
          title="Expense Ratio"
          value={`${data?.expenseRatioPercent || 0}%`}
          icon={<TrendingDown size={20} />}
          severity={(data?.expenseRatioPercent || 0) < 40 ? 'healthy' : (data?.expenseRatioPercent || 0) < 60 ? 'warning' : 'critical'}
        />
        <KPICard
          title="Customer Orders"
          value={data?.customerOrdersToday || 0}
          icon={<Users size={20} />}
        />
        <KPICard
          title="Customer Revenue"
          value={data?.customerRevenueToday || 0}
          isCurrency
          icon={<DollarSign size={20} />}
        />
        <KPICard
          title="Discounts Given"
          value={data?.discountsGiven || 0}
          isCurrency
          icon={<DollarSign size={20} />}
          severity={(data?.discountsGiven || 0) > 0 ? 'warning' : 'healthy'}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Profit / Order"
          value={data?.profitPerOrder || 0}
          isCurrency
          icon={<TrendingUp size={20} />}
          severity={(data?.profitPerOrder || 0) >= 100 ? 'healthy' : (data?.profitPerOrder || 0) > 0 ? 'warning' : 'critical'}
        />
        <KPICard
          title="Expense / Order"
          value={data?.expensePerOrder || 0}
          isCurrency
          icon={<TrendingDown size={20} />}
          severity={(data?.expensePerOrder || 0) < 50 ? 'healthy' : 'warning'}
        />
        <KPICard
          title="Customer Revenue Share"
          value={`${data?.customerRevenueSharePercent || 0}%`}
          icon={<DollarSign size={20} />}
          severity={(data?.customerRevenueSharePercent || 0) >= 40 ? 'healthy' : 'warning'}
        />
        <KPICard
          title="Orders Without Customer"
          value={data?.ordersWithoutCustomer || 0}
          icon={<ShoppingCart size={20} />}
          severity={(data?.ordersWithoutCustomer || 0) > 0 ? 'warning' : 'healthy'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Low Stock"
          value={data?.lowStockAlerts || 0}
          icon={<Package size={20} />}
          severity={
            (data?.lowStockAlerts || 0) > 0 ? 'warning' : 'healthy'
          }
        />
        <KPICard
          title="Open Alerts"
          value={data?.openAlerts || 0}
          icon={<AlertTriangle size={20} />}
          severity={
            (data?.openAlerts || 0) > 3 ? 'critical' : (data?.openAlerts || 0) > 0 ? 'warning' : 'healthy'
          }
        />
        <KPICard
          title="Pending Approvals"
          value={data?.pendingApprovals || 0}
          icon={<Clock size={20} />}
          severity={
            (data?.pendingApprovals || 0) > 0 ? 'warning' : 'healthy'
          }
        />
      </div>
      <div className="rounded-3xl border border-border-default bg-surface-base p-4 text-sm text-text-secondary">
        <p className="mb-2">Open alerts are active issue notifications for your branch. They are not the same as low stock; they track any system-generated alert that needs attention.</p>
        <p>Pending approvals are expense records submitted by staff that still require owner review and approval.</p>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Expense Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4 text-center">No pending approvals</p>
          ) : (
            <div className="space-y-3">
              {approvals.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-surface-base rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {a.category}{' '}
                      <span className="font-normal text-text-secondary">
                        by {a.user.name}
                      </span>
                    </p>
                    {a.description && (
                      <p className="text-xs text-text-tertiary mt-0.5">{a.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-text-primary">
                      {formatCurrency(a.amount)}
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => handleApprove(a.id)}>
                      <CheckCircle size={16} className="text-success" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(a.id)}>
                      <XCircle size={16} className="text-error" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <PaginationControls
              page={approvalPage}
              limit={approvalLimit}
              onPageChange={setApprovalPage}
              onLimitChange={(nextLimit: number) => {
                setApprovalLimit(nextLimit);
                setApprovalPage(0);
              }}
              hasMore={approvalsHasMore}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrders.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4 text-center">No purchase order activity yet</p>
          ) : (
            <>
              <div className="space-y-4">
                {purchaseOrders.map((po) => (
                  <div key={po.id} className="rounded-3xl border border-border-default bg-surface-base p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{po.supplier?.name}</p>
                        <p className="text-xs text-text-secondary">Ordered on {new Date(po.orderedAt).toLocaleDateString('en-GH')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={po.status} />
                        <span className="text-sm font-semibold text-text-primary">{formatCurrency(po.totalAmount)}</span>
                      </div>
                    </div>
                    {po.notes && (
                      <p className="mt-3 text-sm text-text-secondary">Notes: {po.notes}</p>
                    )}
                    <div className="mt-4 space-y-2">
                      {po.items.map((item) => (
                        <div key={item.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_0.8fr_0.8fr_0.8fr] text-sm text-text-secondary">
                          <span className="font-medium text-text-primary">{item.ingredient?.name}</span>
                          <span>{item.quantity} x {formatCurrency(item.unitCost)}</span>
                          <span>Received {item.receivedQty}</span>
                          <span className="text-text-secondary">Line total {formatCurrency(Number(item.quantity) * Number(item.unitCost))}</span>
                        </div>
                      ))}
                    </div>
                    {po.status === 'SENT' && (
                      <div className="mt-4 flex justify-end">
                        <Button size="sm" onClick={() => handleReceivePurchaseOrder(po)}>
                          Mark Received
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <PaginationControls
                  page={purchaseOrdersPage}
                  limit={purchaseOrdersLimit}
                  onPageChange={setPurchaseOrdersPage}
                  onLimitChange={(value: number) => { setPurchaseOrdersLimit(value); setPurchaseOrdersPage(0); }}
                  hasMore={purchaseOrdersHasMore}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
