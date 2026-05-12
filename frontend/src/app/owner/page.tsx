'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { formatCurrency, printPurchaseOrderInvoice } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination';
import { PageSkeleton } from '@/components/ui/skeleton';
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
  FileText,
  Percent,
  ReceiptText,
  CalendarDays,
  Star,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  inventoryAssetValue: number;
  inventoryItemCount: number;
  openAlerts: number;
  pendingApprovals: number;
}

interface MenuProfitabilityItem {
  id: string;
  name: string;
  totalSold: number;
  grossProfit: number;
  marginPercent: number;
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

// ─── StatTile ────────────────────────────────────────────────────────────────

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

// ─── Section Title ────────────────────────────────────────────────────────────

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OwnerDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalPage, setApprovalPage] = useState(0);
  const approvalLimit = 10;
  const [approvalsHasMore, setApprovalsHasMore] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [menuProfitability, setMenuProfitability] = useState<MenuProfitabilityItem[]>([]);
  const [purchaseOrdersPage, setPurchaseOrdersPage] = useState(0);
  const purchaseOrdersLimit = 5;
  const [purchaseOrdersHasMore, setPurchaseOrdersHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rangePreset, setRangePreset] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const formatISO = (date: Date) => date.toISOString().split('T')[0];

  const dateRange = (preset: typeof rangePreset) => {
    const now = new Date();
    const to = formatISO(now);
    if (preset === 'day') return { from: to, to };
    if (preset === 'week') {
      const offset = (now.getDay() + 6) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - offset);
      return { from: formatISO(start), to };
    }
    if (preset === 'month') {
      return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to };
    }
    return { from: `${now.getFullYear()}-01-01`, to };
  };

  const fetchAll = async (preset: typeof rangePreset, appPage: number, poPage: number) => {
    if (!token) return;
    setLoading(true);
    const { from, to } = dateRange(preset);
    try {
      const [dash, apps, pos, profitability] = await Promise.all([
        get(`/api/v1/owner/dashboard?from=${from}&to=${to}`, token),
        get(`/api/v1/owner/approvals/pending?page=${appPage}&limit=${approvalLimit}`, token),
        get(`/api/v1/purchase-orders?page=${poPage}&limit=${purchaseOrdersLimit}`, token),
        get(`/api/v1/reports/menu-profitability?from=${from}&to=${to}`, token),
      ]);
      setData(dash);
      setApprovals(apps);
      setApprovalsHasMore(apps.length === approvalLimit);
      setPurchaseOrders(pos);
      setPurchaseOrdersHasMore(pos.length === purchaseOrdersLimit);
      setMenuProfitability(profitability as MenuProfitabilityItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(rangePreset, approvalPage, purchaseOrdersPage); }, [token, rangePreset, approvalPage, purchaseOrdersPage]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      await post(`/api/v1/owner/approvals/${id}/approve`, {}, token);
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setData((d) => d ? { ...d, pendingApprovals: Math.max(0, d.pendingApprovals - 1) } : d);
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    try {
      await post(`/api/v1/owner/approvals/${id}/reject`, {}, token);
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setData((d) => d ? { ...d, pendingApprovals: Math.max(0, d.pendingApprovals - 1) } : d);
    } catch (err) { console.error(err); }
  };

  const handleReceivePurchaseOrder = async (po: PurchaseOrder) => {
    if (!token) return;
    try {
      await post(`/api/v1/purchase-orders/${po.id}/receive`, {
        items: po.items.map((item) => ({ purchaseOrderItemId: item.id, receivedQty: item.quantity })),
      }, token);
      setPurchaseOrders((prev) =>
        prev.map((order) =>
          order.id === po.id ? { ...order, status: 'RECEIVED', receivedAt: new Date().toISOString() } : order,
        ),
      );
    } catch (err) { console.error(err); }
  };

  if (loading) return <PageSkeleton />;

  const d = data;
  const presets = [
    { key: 'day' as const, label: 'Today' },
    { key: 'week' as const, label: 'This Week' },
    { key: 'month' as const, label: 'This Month' },
    { key: 'year' as const, label: 'This Year' },
  ];
  const { from, to } = dateRange(rangePreset);
  const dateLabel = from === to
    ? new Date(from + 'T12:00:00').toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : `${new Date(from + 'T12:00:00').toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })} – ${new Date(to + 'T12:00:00').toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-8 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">{getGreeting()}</p>
          <h1 className="mt-1 text-2xl font-bold text-text-primary">
            {user?.name ? user.name.split(' ')[0] : 'Owner'}&apos;s Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary flex items-center gap-1.5">
            <CalendarDays size={14} className="shrink-0" />
            {dateLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setRangePreset(p.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                rangePreset === p.key
                  ? 'bg-[var(--color-gold)] text-white shadow-sm'
                  : 'bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Performance ── */}
      <div className="space-y-3">
        <SectionTitle title="Performance" description="How your restaurant is doing in the selected time period" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={<DollarSign size={18} />}
            label="Total Sales"
            value={formatCurrency(d?.salesToday || 0)}
            helper="Money collected from all orders"
            tone={(d?.salesToday || 0) > 0 ? 'green' : 'default'}
          />
          <StatTile
            icon={<ShoppingCart size={18} />}
            label="Orders Placed"
            value={d?.ordersToday || 0}
            helper="Total number of completed orders"
          />
          <StatTile
            icon={<ReceiptText size={18} />}
            label="Average Order"
            value={formatCurrency(d?.averageTicket || 0)}
            helper="Average amount per order"
            tone={(d?.averageTicket || 0) > 0 ? 'green' : 'default'}
          />
          <StatTile
            icon={<Package size={18} />}
            label="Inventory Worth"
            value={formatCurrency(d?.inventoryAssetValue || 0)}
            helper="Total value of inventory on hand"
            tone={(d?.inventoryAssetValue || 0) > 0 ? 'green' : 'default'}
          />
        </div>
      </div>

      {/* ── Margins ── */}
      <div className="space-y-3">
        <SectionTitle title="Profit & Costs" description="How efficiently your restaurant turns sales into profit" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={<Percent size={18} />}
            label="Gross Margin"
            value={`${d?.grossMarginPercent ?? 0}%`}
            helper="Higher is better — aim for 30%+"
            tone={(d?.grossMarginPercent ?? 0) >= 30 ? 'green' : (d?.grossMarginPercent ?? 0) > 10 ? 'yellow' : 'red'}
          />
          <StatTile
            icon={<TrendingDown size={18} />}
            label="Expense Ratio"
            value={`${d?.expenseRatioPercent ?? 0}%`}
            helper="Expenses as % of sales — lower is better"
            tone={(d?.expenseRatioPercent ?? 0) < 40 ? 'green' : (d?.expenseRatioPercent ?? 0) < 60 ? 'yellow' : 'red'}
          />
          <StatTile
            icon={<TrendingUp size={18} />}
            label="Profit per Order"
            value={formatCurrency(d?.profitPerOrder || 0)}
            helper="How much you keep from each order"
            tone={(d?.profitPerOrder || 0) >= 100 ? 'green' : (d?.profitPerOrder || 0) > 0 ? 'yellow' : 'red'}
          />
          <StatTile
            icon={<TrendingDown size={18} />}
            label="Expense per Order"
            value={formatCurrency(d?.expensePerOrder || 0)}
            helper="Cost incurred per order on average"
            tone={(d?.expensePerOrder || 0) < 50 ? 'green' : 'yellow'}
          />
        </div>
      </div>

      {/* ── Customers ── */}
      <div className="space-y-3">
        <SectionTitle title="Customer Activity" description="Tracked customers who ordered in this period" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={<Users size={18} />}
            label="Customer Orders"
            value={d?.customerOrdersToday || 0}
            helper="Orders linked to a customer profile"
            tone={(d?.customerOrdersToday || 0) > 0 ? 'green' : 'default'}
          />
          <StatTile
            icon={<DollarSign size={18} />}
            label="Customer Revenue"
            value={formatCurrency(d?.customerRevenueToday || 0)}
            helper="Revenue from identified customers"
            tone={(d?.customerRevenueToday || 0) > 0 ? 'green' : 'default'}
          />
          <StatTile
            icon={<Percent size={18} />}
            label="Revenue Share"
            value={`${d?.customerRevenueSharePercent ?? 0}%`}
            helper="% of sales from known customers"
            tone={(d?.customerRevenueSharePercent ?? 0) >= 40 ? 'green' : 'yellow'}
          />
          <StatTile
            icon={<Star size={18} />}
            label="Discounts Given"
            value={formatCurrency(d?.discountsGiven || 0)}
            helper="Total promotional discounts applied"
            tone={(d?.discountsGiven || 0) > 0 ? 'yellow' : 'default'}
          />
        </div>
      </div>

      {/* ── Inventory Health ── */}
      <div className="space-y-3">
        <SectionTitle title="Inventory Health" description="Track stock value and item count at a glance" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={<Package size={18} />}
            label="Inventory Worth"
            value={formatCurrency(d?.inventoryAssetValue || 0)}
            helper="Current value of stock on hand"
          />
          <StatTile
            icon={<Package size={18} />}
            label="Inventory Items"
            value={d?.inventoryItemCount || 0}
            helper="Unique ingredients currently stocked"
          />
          <StatTile
            icon={<AlertTriangle size={18} />}
            label="Low Stock Items"
            value={d?.lowStockAlerts || 0}
            helper="Ingredients below reorder level"
            tone={(d?.lowStockAlerts || 0) > 0 ? 'yellow' : 'green'}
          />
          <StatTile
            icon={<Clock size={18} />}
            label="Pending Approvals"
            value={d?.pendingApprovals || 0}
            helper="Staff expense requests awaiting review"
            tone={(d?.pendingApprovals || 0) > 0 ? 'yellow' : 'green'}
          />
        </div>
      </div>

      {/* ── Alerts Banner ── */}
      <div className="space-y-3">
        <SectionTitle title="Attention Needed" description="Items that may need your action right now" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatTile
            icon={<Package size={18} />}
            label="Low Stock Items"
            value={d?.lowStockAlerts || 0}
            helper="Ingredients running below reorder level"
            tone={(d?.lowStockAlerts || 0) > 0 ? 'yellow' : 'green'}
          />
          <StatTile
            icon={<AlertTriangle size={18} />}
            label="Open Alerts"
            value={d?.openAlerts || 0}
            helper="System issues needing your attention"
            tone={(d?.openAlerts || 0) > 3 ? 'red' : (d?.openAlerts || 0) > 0 ? 'yellow' : 'green'}
          />
          <StatTile
            icon={<Clock size={18} />}
            label="Pending Approvals"
            value={d?.pendingApprovals || 0}
            helper="Expense submissions waiting for review"
            tone={(d?.pendingApprovals || 0) > 0 ? 'yellow' : 'green'}
          />
        </div>
      </div>

      {/* ── Expense Approvals ── */}
      <div className="space-y-3">
        <SectionTitle
          title="Expense Approvals"
          description="Your staff have submitted these expenses. Tap Approve or Reject on each."
        />
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          {approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <CheckCircle size={32} className="text-success opacity-60" />
              <p className="text-sm font-semibold text-text-secondary">All clear — no pending approvals</p>
              <p className="text-xs text-text-tertiary">Staff expense submissions will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {approvals.map((a) => (
                <div key={a.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-base">{a.category}</p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Submitted by <span className="font-medium">{a.user.name}</span>
                    </p>
                    {a.description && (
                      <p className="mt-1 text-sm text-text-tertiary">{a.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <span className="text-2xl font-bold text-text-primary font-mono min-w-0 break-words">
                      {formatCurrency(a.amount)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleApprove(a.id)}
                    >
                      <CheckCircle size={15} className="text-success" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(a.id)}
                    >
                      <XCircle size={15} /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 pb-4 pt-2">
            <PaginationControls
              page={approvalPage}
              limit={approvalLimit}
              onPageChange={setApprovalPage}
              onLimitChange={() => {}}
              hasMore={approvalsHasMore}
            />
          </div>
        </div>
      </div>

      {/* ── Menu Profitability ── */}
      <div className="space-y-3">
        <SectionTitle title="Menu Profitability" description="See which items are selling best and making the most money." />
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          {menuProfitability.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Package size={32} className="text-text-tertiary opacity-60" />
              <p className="text-sm font-semibold text-text-secondary">No menu profitability data yet</p>
              <p className="text-xs text-text-tertiary">Sales and cost data will appear here for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-text-tertiary text-xs uppercase tracking-widest">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium text-right">Sold</th>
                    <th className="px-4 py-3 font-medium text-right">Profit</th>
                    <th className="px-4 py-3 font-medium text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {menuProfitability.slice(0, 5).map((item) => (
                    <tr key={item.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3 font-medium text-text-primary">{item.name}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{item.totalSold}</td>
                      <td className="px-4 py-3 text-right text-text-primary font-mono">{formatCurrency(item.grossProfit)}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{item.marginPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Purchase Orders ── */}
      <div className="space-y-3">
        <SectionTitle
          title="Recent Purchase Orders"
          description="Stock orders placed with your suppliers. Mark them received when goods arrive."
        />
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          {purchaseOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Package size={32} className="text-text-tertiary opacity-60" />
              <p className="text-sm font-semibold text-text-secondary">No purchase orders yet</p>
              <p className="text-xs text-text-tertiary">Orders placed with suppliers will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="p-4 space-y-4">
                  {/* PO header */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-text-primary text-base">{po.supplier?.name}</p>
                      <p className="text-sm text-text-secondary mt-0.5">
                        Ordered on {new Date(po.orderedAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {po.notes && (
                        <p className="mt-1 text-sm text-text-tertiary">Note: {po.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={po.status} />
                      <span className="text-lg font-bold text-text-primary font-mono whitespace-normal break-words">{formatCurrency(po.totalAmount)}</span>
                    </div>
                  </div>

                  {/* PO line items */}
                  <div className="rounded-2xl bg-surface-elevated border border-border-subtle overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle text-text-tertiary text-xs">
                          <th className="px-3 py-2 text-left font-medium">Item</th>
                          <th className="px-3 py-2 text-right font-medium">Qty</th>
                          <th className="px-3 py-2 text-right font-medium">Unit Cost</th>
                          <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">Received</th>
                          <th className="px-3 py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.items.map((item) => (
                          <tr key={item.id} className="border-b border-border-subtle last:border-0">
                            <td className="px-3 py-2 font-medium text-text-primary">{item.ingredient?.name}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(item.unitCost)}</td>
                            <td className="px-3 py-2 text-right text-text-secondary hidden sm:table-cell">{item.receivedQty}</td>
                            <td className="px-3 py-2 text-right font-medium text-text-primary">
                              {formatCurrency(Number(item.quantity) * Number(item.unitCost))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PO actions */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => printPurchaseOrderInvoice(po)}
                    >
                      <FileText size={14} /> Print Invoice
                    </Button>
                    {po.status === 'SENT' && (
                      <Button
                        size="sm"
                        onClick={() => handleReceivePurchaseOrder(po)}
                      >
                        <CheckCircle size={14} /> Mark as Received
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 pb-4 pt-2">
            <PaginationControls
              page={purchaseOrdersPage}
              limit={purchaseOrdersLimit}
              onPageChange={setPurchaseOrdersPage}
              onLimitChange={() => {}}
              hasMore={purchaseOrdersHasMore}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
