'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { API_PATHS, ORDER_GROUP_BY_OPTIONS, ORDER_STATUS_FILTERS } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTime, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Download } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface Order {
  id: string;
  channel: string;
  status: string;
  paymentMethod: string;
  total: number;
  foodCost: number;
  createdAt: string;
  matchedItemCount?: number;
  items: {
    menuItem: { name: string; category?: { id: string; name: string } | null };
    quantity: number;
    unitPrice: number;
    unitCost: number;
    selectedOptions?: { optionId: string; optionName?: string; values: string[]; labels?: string[] }[];
    ingredientCosts?: {
      ingredientName: string;
      ingredientUnit: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }[];
  }[];
}

interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export default function OwnerOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<{ count: number; totalRevenue: number; avgTicket: number; foodCost: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<typeof ORDER_GROUP_BY_OPTIONS[number]>('NONE');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const filterParams = {
    status: statusFilter || undefined,
    channel: channelFilter || undefined,
    paymentMethod: paymentFilter || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    search: searchQuery.trim() || undefined,
  };

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    const catParts = selectedCategoryIds.map((id) => `categoryIds=${encodeURIComponent(id)}`).join('&');
    try {
      const ordersBase = buildQueryString({ ...filterParams, page, limit });
      const statsBase = buildQueryString(filterParams);
      const ordersUrl = `/api/v1/orders${ordersBase}${catParts ? '&' + catParts : ''}`;
      const statsUrl = `/api/v1/orders/stats${statsBase}${catParts ? (statsBase ? '&' : '?') + catParts : ''}`;
      const [data, statsData] = await Promise.all([
        get(ordersUrl, token),
        get(statsUrl, token),
      ]);
      setOrders(data);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories once on mount
  useEffect(() => {
    if (!token) return;
    get('/api/v1/menu/categories?limit=50', token)
      .then((res) => setCategories(res as MenuCategory[]))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [token, statusFilter, channelFilter, paymentFilter, fromDate, toDate, searchQuery, page, limit, selectedCategoryIds]);

  const statuses = ORDER_STATUS_FILTERS;

  const channels = useMemo(
    () => Array.from(new Set(orders.map((order) => order.channel))).sort(),
    [orders],
  );

  const paymentMethods = useMemo(
    () => Array.from(new Set(orders.map((order) => order.paymentMethod || 'UNKNOWN'))).sort(),
    [orders],
  );

  const groupedOrders = useMemo(() => {
    if (groupBy === 'NONE') {
      return { All: orders };
    }

    return orders.reduce((acc, order) => {
      let groupKey = 'Unknown';
      switch (groupBy) {
        case 'STATUS':
          groupKey = order.status;
          break;
        case 'CHANNEL':
          groupKey = order.channel;
          break;
        case 'PAYMENT_METHOD':
          groupKey = order.paymentMethod || 'Unknown';
          break;
        case 'DATE':
          groupKey = new Date(order.createdAt).toLocaleDateString('en-GH');
          break;
        default:
          groupKey = 'All';
      }
      acc[groupKey] = acc[groupKey] || [];
      acc[groupKey].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
  }, [groupBy, orders]);

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <ShoppingCart className="text-[var(--color-gold)]" /> Orders
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">View and filter all customer orders</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => {
          const rows = [['ID', 'Date', 'Status', 'Channel', 'Payment', 'Total', 'Food Cost'].join(','),
            ...orders.map(o => [
              o.id,
              new Date(o.createdAt).toLocaleDateString('en-GH'),
              o.status,
              o.channel,
              o.paymentMethod,
              o.total,
              o.foodCost ?? '',
            ].join(','))
          ].join('\n');
          const a = document.createElement('a');
          a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows);
          a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
        }}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Stat tiles — from backend aggregate, not current page */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Total Orders</p>
            <p className="text-3xl font-bold font-mono text-text-primary mt-1">{stats.count}</p>
          </div>
          <div className="rounded-2xl border border-success/30 bg-success-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-success">Total Revenue</p>
            <p className="text-2xl font-bold font-mono text-success mt-1">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Avg Ticket</p>
            <p className="text-2xl font-bold font-mono text-text-primary mt-1">{formatCurrency(stats.avgTicket)}</p>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Food Cost</p>
            <p className="text-2xl font-bold font-mono text-text-primary mt-1">{formatCurrency(stats.foodCost)}</p>
          </div>
        </div>
      )}


      {/* Filters */}
      <div className="rounded-3xl border border-border-default bg-surface-raised p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Order ID, item name..."
              className="w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]" />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Channel</label>
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]">
              <option value="">All Channels</option>
              {channels.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Payment</label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]">
              <option value="">All Payments</option>
              {paymentMethods.map((m) => <option key={m} value={m === 'UNKNOWN' ? '' : m}>{m === 'UNKNOWN' ? 'Unknown' : m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Group By</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof ORDER_GROUP_BY_OPTIONS[number])} className="w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]">
              {ORDER_GROUP_BY_OPTIONS.map((option) => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${ statusFilter === s ? 'bg-[var(--color-gold)] text-white' : 'bg-surface-base border border-border-subtle text-text-secondary hover:text-text-primary' }`}>{s || 'All'}</button>
          ))}
          <button type="button" onClick={() => { setStatusFilter(''); setChannelFilter(''); setPaymentFilter(''); setFromDate(''); setToDate(''); setSearchQuery(''); setGroupBy('NONE'); setSelectedCategoryIds([]); }} className="ml-auto rounded-full px-4 py-2 text-xs font-semibold border border-border-subtle text-text-secondary hover:text-text-primary">
            Clear filters
          </button>
        </div>
        {categories.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border-subtle">
            <p className="text-xs font-medium text-text-secondary">Menu Type</p>
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
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border ${
                      active
                        ? 'bg-[var(--color-gold)] text-white border-[var(--color-gold)] shadow-sm'
                        : 'bg-surface-base border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <PageSkeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-border-default bg-surface-raised flex flex-col items-center gap-2 py-16 text-center">
          <ShoppingCart size={32} className="opacity-30" />
          <p className="text-sm font-semibold text-text-secondary">No orders found</p>
          <p className="text-xs text-text-tertiary">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {Object.entries(groupedOrders).map(([groupLabel, groupOrders]) => {
              const groupTotal = groupOrders.reduce((sum, order) => sum + Number(order.total), 0);
              return (
                <div key={groupLabel} className="space-y-3">
                  {groupBy !== 'NONE' && (
                    <div className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface-elevated px-4 py-3 text-sm font-medium text-text-secondary">
                      <span>{groupLabel}</span>
                      <span>{groupOrders.length} orders · {formatCurrency(groupTotal)}</span>
                    </div>
                  )}
                  <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden divide-y divide-border-subtle">
                    {groupOrders.map((order) => {
                      const isExpanded = expandedOrders.includes(order.id);
                      const matchCount = order.matchedItemCount ?? null;
                      return (
                        <div key={order.id} className="p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={order.status} />
                                <span className="text-xs text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded-full">{order.channel}</span>
                                <span className="text-xs text-text-tertiary">{order.paymentMethod || 'Unknown'}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                                <span>{order.items.length} items</span>
                                {matchCount !== null && matchCount < order.items.length && (
                                  <span className="text-xs font-semibold text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2 py-0.5 rounded-full">
                                    {matchCount} match filter
                                  </span>
                                )}
                                <span>·</span>
                                <span>{formatDateTime(order.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-xs text-text-secondary">Total</p>
                                <p className="text-lg font-bold font-mono text-text-primary">{formatCurrency(order.total)}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => toggleOrderExpanded(order.id)}>
                                {isExpanded ? 'Hide' : 'Details'}
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2 text-sm text-text-secondary">
                            {order.items.slice(0, 3).map((item, idx) => {
                              const itemMatches = selectedCategoryIds.length === 0 || selectedCategoryIds.includes(item.menuItem?.category?.id ?? '');
                              return (
                              <div key={idx} className={`flex items-center justify-between gap-3 rounded-2xl p-3 transition-opacity ${itemMatches ? 'bg-surface-base' : 'bg-surface-base opacity-40'}`}>
                                <div>
                                  <p className="font-medium text-text-primary">{item.quantity}x {item.menuItem?.name}
                                    {!itemMatches && <span className="ml-1.5 text-xs text-text-tertiary">({item.menuItem?.category?.name})</span>}
                                  </p>
                                  <p className="text-xs text-text-secondary">{formatCurrency(item.unitPrice * item.quantity)} total</p>
                                </div>
                                <span className="text-xs text-text-tertiary">Cost {formatCurrency(item.unitCost * item.quantity)}</span>
                              </div>
                              );
                            })}
                            {order.items.length > 3 && (
                              <p className="text-xs text-text-secondary">+{order.items.length - 3} more item(s)</p>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-base p-4 space-y-3">
                              {order.items.map((item, idx) => {
                                const itemMatches = selectedCategoryIds.length === 0 || selectedCategoryIds.includes(item.menuItem?.category?.id ?? '');
                                return (
                                <div key={idx} className={`space-y-2 rounded-2xl p-3 transition-opacity ${itemMatches ? 'bg-surface-raised' : 'bg-surface-raised opacity-40'}`}>
                                  <div className="flex items-center justify-between gap-3 text-text-primary">
                                    <span className="font-semibold text-sm">{item.quantity}x {item.menuItem?.name}</span>
                                    <span className="font-mono text-sm">{formatCurrency(item.unitPrice * item.quantity)}</span>
                                  </div>
                                  {item.selectedOptions?.length ? (
                                    <div className="space-y-1 text-xs text-text-secondary">
                                      {item.selectedOptions.map((selected) => (
                                        <p key={selected.optionId}>{selected.optionName || selected.optionId}: {selected.labels?.length ? selected.labels.join(', ') : selected.values.join(', ')}</p>
                                      ))}
                                    </div>
                                  ) : null}
                                  <div className="flex flex-wrap justify-between gap-3 text-xs text-text-secondary">
                                    <span>Unit cost {formatCurrency(item.unitCost)}</span>
                                    <span>Food cost {formatCurrency(item.unitCost * item.quantity)}</span>
                                  </div>
                                  {item.ingredientCosts?.length ? (
                                    <div className="space-y-1 pt-1">
                                      {item.ingredientCosts.map((cost) => (
                                        <div key={`${cost.ingredientName}-${cost.ingredientUnit}`} className="flex flex-wrap justify-between gap-3 text-xs text-text-secondary">
                                          <span>{cost.ingredientName} ({cost.quantity}{cost.ingredientUnit})</span>
                                          <span>{formatCurrency(cost.totalCost * item.quantity)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                            <div className="rounded-2xl bg-surface-base p-3">
                              <p className="text-xs text-text-tertiary">Food cost</p>
                              <p className="font-mono font-semibold text-text-primary">{formatCurrency(order.foodCost)}</p>
                            </div>
                            <div className="rounded-2xl bg-surface-base p-3">
                              <p className="text-xs text-text-tertiary">Margin</p>
                              <p className="font-mono font-semibold text-text-primary">{formatCurrency(order.total - order.foodCost)}</p>
                            </div>
                            <div className="rounded-2xl bg-surface-base p-3">
                              <p className="text-xs text-text-tertiary">Margin %</p>
                              <p className="font-mono font-semibold text-text-primary">{order.total > 0 ? `${Math.round(((order.total - order.foodCost) / order.total) * 100)}%` : '0%'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(0); }}
            hasMore={orders.length === limit}
          />
        </>
      )}
    </div>
  );
}
