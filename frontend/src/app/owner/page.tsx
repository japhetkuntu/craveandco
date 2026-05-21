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
  ShoppingBag,
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

interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

interface DashboardData {
  date: string;
  salesToday: number;
  ordersToday: number;
  averageTicket: number;
  expensesToday: number;
  foodCostToday: number;
  filteredSales: number | null;
  filteredOrderCount: number | null;
  filteredAvgTicket: number | null;
  grossProfit: number;
  netProfit: number;
  grossEstimate: number;
  grossMarginPercent: number;
  netMarginPercent: number;
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
  categoryId: string | null;
  categoryName: string | null;
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

interface SpecialOrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
}

interface SpecialOrder {
  id: string;
  customerName?: string;
  status: 'DRAFT' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  user?: { name: string };
  items: SpecialOrderItem[];
}

function calcSpecialMargin(items: SpecialOrderItem[]) {
  const revenue = items.reduce((s, i) => s + Number(i.sellPrice) * Number(i.quantity), 0);
  const cost = items.reduce((s, i) => s + Number(i.costPrice) * Number(i.quantity), 0);
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return { revenue, cost, profit, margin };
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
  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>([]);
  const [selectedSpecialOrder, setSelectedSpecialOrder] = useState<SpecialOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangePreset, setRangePreset] = useState<'day' | 'yesterday' | 'week' | 'month' | 'year'>('day');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const formatISO = (date: Date) => date.toISOString().split('T')[0];

  const dateRange = (preset: typeof rangePreset) => {
    const now = new Date();
    const to = formatISO(now);
    if (preset === 'day') return { from: to, to };
    if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const iso = formatISO(y);
      return { from: iso, to: iso };
    }
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

  const fetchAll = async (preset: typeof rangePreset, appPage: number, poPage: number, catIds: string[] = []) => {
    if (!token) return;
    setLoading(true);
    const { from, to } = dateRange(preset);
    const catParam = catIds.length ? '&' + catIds.map((id) => `categoryIds=${encodeURIComponent(id)}`).join('&') : '';
    try {
      const [dash, apps, pos, profitability, specials] = await Promise.all([
        get(`/api/v1/owner/dashboard?from=${from}&to=${to}${catParam}`, token),
        get(`/api/v1/owner/approvals/pending?page=${appPage}&limit=${approvalLimit + 1}`, token),
        get(`/api/v1/purchase-orders?page=${poPage}&limit=${purchaseOrdersLimit + 1}`, token),
        get(`/api/v1/reports/menu-profitability?from=${from}&to=${to}${catParam}`, token),
        get(`/api/v1/special-orders?limit=10&from=${from}&to=${to}`, token),
      ]);
      setData(dash);
      setApprovals(apps.slice(0, approvalLimit));
      setApprovalsHasMore(apps.length > approvalLimit);
      setPurchaseOrders(pos.slice(0, purchaseOrdersLimit));
      setPurchaseOrdersHasMore(pos.length > purchaseOrdersLimit);
      setMenuProfitability(profitability as MenuProfitabilityItem[]);
      setSpecialOrders(specials as SpecialOrder[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories once
  useEffect(() => {
    if (!token) return;
    get('/api/v1/menu/categories?limit=50', token)
      .then((res) => setCategories(res as MenuCategory[]))
      .catch(console.error);
  }, [token]);

  useEffect(() => { fetchAll(rangePreset, approvalPage, purchaseOrdersPage, selectedCategoryIds); }, [token, rangePreset, approvalPage, purchaseOrdersPage, selectedCategoryIds]);

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

  const handleApprovePO = async (po: PurchaseOrder) => {
    if (!token) return;
    try {
      await post(`/api/v1/purchase-orders/${po.id}/approve`, {}, token);
      setPurchaseOrders((prev) =>
        prev.map((order) =>
          order.id === po.id ? { ...order, status: 'RECEIVED' } : order,
        ),
      );
    } catch (err) { console.error(err); }
  };

  const handleRejectPO = async (po: PurchaseOrder) => {
    if (!token) return;
    try {
      await post(`/api/v1/purchase-orders/${po.id}/cancel`, {}, token);
      setPurchaseOrders((prev) =>
        prev.map((order) =>
          order.id === po.id ? { ...order, status: 'CANCELLED' } : order,
        ),
      );
    } catch (err) { console.error(err); }
  };

  if (loading) return <PageSkeleton />;

  const d = data;
  const isFiltered = selectedCategoryIds.length > 0;
  const presets = [
    { key: 'day' as const, label: 'Today' },
    { key: 'yesterday' as const, label: 'Yesterday' },
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

      {/* ── Category Filter ── */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Filter by Menu Type</p>
            {isFiltered && (
              <button
                onClick={() => setSelectedCategoryIds([])}
                className="text-xs font-semibold text-[var(--color-gold)] hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategoryIds((prev) =>
                      active ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
                    )
                  }
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors border ${
                    active
                      ? 'bg-[var(--color-gold)] text-white border-[var(--color-gold)] shadow-sm'
                      : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          {isFiltered && (
            <p className="text-xs text-text-secondary">
              Showing data for: <span className="font-semibold text-text-primary">{selectedCategoryIds.map((id) => categories.find((c) => c.id === id)?.name).filter(Boolean).join(', ')}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Performance ── */}
      <div className="space-y-3">
        <SectionTitle title="Performance" description={isFiltered ? 'Filtered by selected menu types' : 'How your restaurant is doing in the selected time period'} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={<DollarSign size={18} />}
            label="Total Sales"
            value={formatCurrency(isFiltered ? (d?.filteredSales ?? 0) : (d?.salesToday || 0))}
            helper={isFiltered ? `Revenue from ${selectedCategoryIds.length} selected type(s)` : 'Money collected from all orders'}
            tone={(isFiltered ? (d?.filteredSales ?? 0) : (d?.salesToday || 0)) > 0 ? 'green' : 'default'}
          />
          <StatTile
            icon={<ShoppingCart size={18} />}
            label="Orders Placed"
            value={isFiltered ? (d?.filteredOrderCount ?? 0) : (d?.ordersToday || 0)}
            helper={isFiltered ? 'Orders containing items from selected types' : 'Total number of completed orders'}
          />
          <StatTile
            icon={<ReceiptText size={18} />}
            label="Average Order"
            value={formatCurrency(isFiltered ? (d?.filteredAvgTicket ?? 0) : (d?.averageTicket || 0))}
            helper={isFiltered ? 'Avg. category revenue per order' : 'Average amount per order'}
            tone={(isFiltered ? (d?.filteredAvgTicket ?? 0) : (d?.averageTicket || 0)) > 0 ? 'green' : 'default'}
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatTile
            icon={<ShoppingBag size={18} />}
            label="Food Cost (COGS)"
            value={formatCurrency(d?.foodCostToday ?? 0)}
            helper="Ingredient cost from all orders this period"
            tone={(d?.foodCostToday ?? 0) > 0 ? 'yellow' : 'default'}
          />
          <StatTile
            icon={<TrendingUp size={18} />}
            label="Gross Profit"
            value={formatCurrency(d?.grossProfit ?? 0)}
            helper="Sales minus food cost (COGS)"
            tone={(d?.grossProfit ?? 0) > 0 ? 'green' : (d?.grossProfit ?? 0) === 0 ? 'default' : 'red'}
          />
          <StatTile
            icon={<DollarSign size={18} />}
            label="Net Profit"
            value={formatCurrency(d?.netProfit ?? 0)}
            helper="After all expenses are deducted"
            tone={(d?.netProfit ?? 0) > 0 ? 'green' : (d?.netProfit ?? 0) === 0 ? 'default' : 'red'}
          />
          <StatTile
            icon={<TrendingDown size={18} />}
            label="Total Expenses"
            value={formatCurrency(d?.expensesToday || 0)}
            helper="Operating costs + purchase orders in this period"
            tone={(d?.expensesToday || 0) === 0 ? 'default' : 'yellow'}
          />
          <StatTile
            icon={<Percent size={18} />}
            label="Gross Margin"
            value={`${d?.grossMarginPercent ?? 0}%`}
            helper="Revenue minus food cost — aim for 60%+"
            tone={(d?.grossMarginPercent ?? 0) >= 60 ? 'green' : (d?.grossMarginPercent ?? 0) > 40 ? 'yellow' : 'red'}
          />
          <StatTile
            icon={<TrendingUp size={18} />}
            label="Net Margin"
            value={`${d?.netMarginPercent ?? 0}%`}
            helper="After all expenses — aim for 10%+"
            tone={(d?.netMarginPercent ?? 0) >= 10 ? 'green' : (d?.netMarginPercent ?? 0) > 0 ? 'yellow' : 'red'}
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

      {/* ── Special Orders ── */}
      <div className="space-y-3">
        <SectionTitle
          title="Special Orders"
          description="Custom orders tracked with cost, sell price, and profit per item."
        />
        {/* Summary tiles */}
        {(() => {
          const active = specialOrders.filter((o) => o.status !== 'CANCELLED');
          const soRevenue = active.reduce((s, o) => s + calcSpecialMargin(o.items).revenue, 0);
          const soProfit = active.reduce((s, o) => s + calcSpecialMargin(o.items).profit, 0);
          const soAvgMargin = soRevenue > 0 ? Math.round((soProfit / soRevenue) * 100) : 0;
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile
                icon={<Star size={18} />}
                label="Special Orders"
                value={specialOrders.length}
                helper="Total custom orders (last 10)"
              />
              <StatTile
                icon={<Clock size={18} />}
                label="In Progress"
                value={specialOrders.filter((o) => o.status === 'PENDING').length}
                helper="Orders awaiting completion"
                tone={specialOrders.filter((o) => o.status === 'PENDING').length > 0 ? 'yellow' : 'green'}
              />
              <StatTile
                icon={<DollarSign size={18} />}
                label="Revenue"
                value={formatCurrency(soRevenue)}
                helper="From active & completed orders"
                tone={soRevenue > 0 ? 'green' : 'default'}
              />
              <StatTile
                icon={<TrendingUp size={18} />}
                label="Avg Margin"
                value={`${soAvgMargin}%`}
                helper="Profit margin across active orders"
                tone={soAvgMargin >= 40 ? 'green' : soAvgMargin >= 20 ? 'yellow' : soAvgMargin > 0 ? 'red' : 'default'}
              />
            </div>
          );
        })()}
        {/* Orders list */}
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          {specialOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Star size={32} className="text-text-tertiary opacity-60" />
              <p className="text-sm font-semibold text-text-secondary">No special orders yet</p>
              <p className="text-xs text-text-tertiary">Custom orders created by your ops team will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {specialOrders.map((order) => {
                const { revenue, margin } = calcSpecialMargin(order.items);
                return (
                  <button
                    key={order.id}
                    className="w-full text-left flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-surface-elevated transition-colors"
                    onClick={() => setSelectedSpecialOrder(order)}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary text-base">
                        {order.customerName || 'Walk-in Customer'}
                      </p>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {order.user?.name && <span>By {order.user.name} · </span>}
                        {new Date(order.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {order.notes && <p className="mt-1 text-sm text-text-tertiary truncate">{order.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge
                        status={order.status}
                        label={order.status === 'DRAFT' ? 'Awaiting Review' : order.status === 'PENDING' ? 'In Progress' : order.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                      />
                      <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(revenue)}</span>
                      <span className={`text-sm font-semibold ${margin >= 40 ? 'text-success' : margin >= 20 ? 'text-warning' : 'text-error'}`}>
                        {Math.round(margin * 10) / 10}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Purchase Orders ── */}
      <div className="space-y-3">
        <SectionTitle
          title="Recent Purchase Orders"
          description="Stock orders placed by your operations team. Approve them to update inventory."
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
                      <StatusBadge status={po.status} label={po.status === 'RECEIVED' ? 'Approved' : po.status === 'DRAFT' ? 'Pending Approval' : po.status === 'CANCELLED' ? 'Rejected' : undefined} />
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
                            <td className="px-3 py-2 text-right text-text-secondary">{Number(item.quantity).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(item.unitCost)}</td>
                            <td className="px-3 py-2 text-right text-text-secondary hidden sm:table-cell">{Number(item.receivedQty).toFixed(2)}</td>
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
                    {po.status === 'DRAFT' && (
                      <>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectPO(po)}
                        >
                          <XCircle size={14} /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprovePO(po)}
                        >
                          <CheckCircle size={14} /> Approve Order
                        </Button>
                      </>
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

      {/* ── Special Order Detail Modal ── */}
      {selectedSpecialOrder && (() => {
        const order = selectedSpecialOrder;
        const { revenue, cost, profit, margin } = calcSpecialMargin(order.items);
        return (
          <div
            className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4"
            onClick={() => setSelectedSpecialOrder(null)}
          >
            <div
              className="w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col sm:my-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">{order.customerName || 'Walk-in Customer'}</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    {order.user?.name && <span>By {order.user.name} · </span>}
                    {new Date(order.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge
                    status={order.status}
                    label={order.status === 'DRAFT' ? 'Awaiting Review' : order.status === 'PENDING' ? 'In Progress' : order.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                  />
                  <Button variant="secondary" onClick={() => setSelectedSpecialOrder(null)}>Close</Button>
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
                {order.notes && (
                  <div className="rounded-2xl bg-surface-input border border-border-subtle p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-1">Notes</p>
                    <p className="text-sm text-text-primary">{order.notes}</p>
                  </div>
                )}
                <div className="rounded-2xl border border-border-default overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-input text-text-tertiary text-xs uppercase tracking-widest">
                        <th className="px-4 py-3 text-left font-medium">Item</th>
                        <th className="px-4 py-3 text-right font-medium">Qty</th>
                        <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Cost</th>
                        <th className="px-4 py-3 text-right font-medium">Sell</th>
                        <th className="px-4 py-3 text-right font-medium">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => {
                        const iRev = Number(item.sellPrice) * Number(item.quantity);
                        const iCost = Number(item.costPrice) * Number(item.quantity);
                        const iMargin = iRev > 0 ? ((iRev - iCost) / iRev) * 100 : 0;
                        return (
                          <tr key={item.id} className="border-b border-border-subtle last:border-0">
                            <td className="px-4 py-3 font-medium text-text-primary">{item.name}</td>
                            <td className="px-4 py-3 text-right text-text-secondary">{Number(item.quantity).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">{formatCurrency(Number(item.costPrice))}</td>
                            <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(Number(item.sellPrice))}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${iMargin >= 40 ? 'text-success' : iMargin >= 20 ? 'text-warning' : 'text-error'}`}>
                              {Math.round(iMargin)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Footer totals */}
              <div className="border-t border-border-subtle bg-surface-input px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Revenue</p>
                  <p className="text-lg font-bold font-mono text-text-primary">{formatCurrency(revenue)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Cost</p>
                  <p className="text-lg font-bold font-mono text-text-secondary">{formatCurrency(cost)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Profit</p>
                  <p className={`text-lg font-bold font-mono ${profit >= 0 ? 'text-success' : 'text-error'}`}>{formatCurrency(profit)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Margin</p>
                  <p className={`text-lg font-bold font-mono ${margin >= 40 ? 'text-success' : margin >= 20 ? 'text-warning' : 'text-error'}`}>{Math.round(margin * 10) / 10}%</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
