'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { API_PATHS, ORDER_GROUP_BY_OPTIONS, ORDER_STATUS_FILTERS } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTime } from '@/lib/utils';
import { ShoppingCart, Plus, Filter } from 'lucide-react';

interface Order {
  id: string;
  channel: string;
  status: string;
  paymentMethod: string;
  total: number;
  foodCost: number;
  createdAt: string;
  items: {
    menuItem: { name: string };
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

export default function OwnerOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
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

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        paymentMethod: paymentFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit,
      };
      const data = await get(`/api/v1/orders${buildQueryString(params)}`, token);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, statusFilter, channelFilter, paymentFilter, fromDate, toDate, searchQuery, page, limit]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ShoppingCart className="text-gold" /> Orders
        </h1>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr] lg:grid-cols-[1.5fr_1fr_1fr]">
        <label className="block">
          <span className="text-xs font-medium text-text-secondary">Search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Order ID, customer name, or item"
            className="mt-1 w-full rounded-2xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-secondary">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-secondary">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3 items-end">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter size={16} className="text-text-tertiary shrink-0" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s ? 'bg-gold text-white' : 'bg-surface-elevated text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-xs font-medium text-text-secondary">Channel</span>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
          >
            <option value="">All Channels</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-secondary">Payment Method</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
          >
            <option value="">All Payments</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method === 'UNKNOWN' ? '' : method}>
                {method === 'UNKNOWN' ? 'Unknown' : method}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <label className="block max-w-xs w-full">
          <span className="text-xs font-medium text-text-secondary">Group By</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof ORDER_GROUP_BY_OPTIONS[number])}
            className="mt-1 w-full rounded-2xl border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
          >
            {ORDER_GROUP_BY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setStatusFilter('');
            setChannelFilter('');
            setPaymentFilter('');
            setFromDate('');
            setToDate('');
            setSearchQuery('');
            setGroupBy('NONE');
          }}
          className="inline-flex items-center justify-center rounded-2xl border border-border-default bg-surface-raised px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-base"
        >
          Clear filters
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">No orders found</p>
      ) : (
        <>
          <div className="space-y-6">
            {Object.entries(groupedOrders).map(([groupLabel, groupOrders]) => {
              const groupTotal = groupOrders.reduce((sum, order) => sum + order.total, 0);
              return (
                <div key={groupLabel} className="space-y-3">
                  {groupBy !== 'NONE' && (
                    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                      <span>{groupLabel}</span>
                      <span>{groupOrders.length} orders · {formatCurrency(groupTotal)}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {groupOrders.map((order) => {
                      const isExpanded = expandedOrders.includes(order.id);
                      return (
                        <Card key={order.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <StatusBadge status={order.status} />
                                  <span className="text-xs text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded">
                                    {order.channel}
                                  </span>
                                  <span className="text-xs text-text-tertiary">{order.paymentMethod || 'Unknown'}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                                  <span>{order.items.length} items</span>
                                  <span>•</span>
                                  <span>{formatTime(order.createdAt)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm text-text-secondary">Order total</p>
                                  <p className="text-lg font-bold text-text-primary">{formatCurrency(order.total)}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => toggleOrderExpanded(order.id)}>
                                  {isExpanded ? 'Hide details' : 'View details'}
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-text-secondary">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 rounded-3xl bg-surface-base p-3">
                                  <div>
                                    <p className="font-medium text-text-primary">{item.quantity}x {item.menuItem?.name}</p>
                                    <p className="text-xs text-text-secondary">{formatCurrency(item.unitPrice * item.quantity)} total</p>
                                  </div>
                                  <span className="text-xs text-text-tertiary">Cost {formatCurrency(item.unitCost * item.quantity)}</span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-xs text-text-secondary">+{order.items.length - 3} more item(s)</p>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="mt-4 rounded-3xl border border-slate-200 bg-surface-raised p-4">
                                <div className="grid gap-3 text-sm text-text-secondary">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="space-y-2 rounded-3xl bg-white p-3 shadow-sm">
                                      <div className="flex items-center justify-between gap-3 text-text-primary">
                                        <span className="font-semibold">{item.quantity}x {item.menuItem?.name}</span>
                                        <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                                      </div>
                                      {item.selectedOptions?.length ? (
                                        <div className="space-y-1 text-xs text-text-secondary">
                                          {item.selectedOptions.map((selected) => (
                                            <p key={selected.optionId}>
                                              {selected.optionName || selected.optionId}: {selected.labels?.length ? selected.labels.join(', ') : selected.values.join(', ')}
                                            </p>
                                          ))}
                                        </div>
                                      ) : null}
                                      <div className="flex flex-wrap justify-between gap-3 text-xs text-text-secondary">
                                        <span>Unit cost {formatCurrency(item.unitCost)}</span>
                                        <span>Food cost {formatCurrency(item.unitCost * item.quantity)}</span>
                                      </div>
                                      {item.ingredientCosts?.length ? (
                                        <div className="space-y-2 pt-2">
                                          {item.ingredientCosts.map((cost) => (
                                            <div key={`${cost.ingredientName}-${cost.ingredientUnit}`} className="flex flex-wrap justify-between gap-3 text-xs text-text-secondary">
                                              <span>{cost.ingredientName} ({cost.quantity}{cost.ingredientUnit})</span>
                                              <span>{formatCurrency(cost.totalCost * item.quantity)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-text-secondary">No ingredient details available.</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-text-secondary">
                              <div className="rounded-3xl bg-surface-base p-3">
                                <p className="font-medium text-text-primary">Food cost</p>
                                <p>{formatCurrency(order.foodCost)}</p>
                              </div>
                              <div className="rounded-3xl bg-surface-base p-3">
                                <p className="font-medium text-text-primary">Margin</p>
                                <p>{formatCurrency(order.total - order.foodCost)}</p>
                              </div>
                              <div className="rounded-3xl bg-surface-base p-3">
                                <p className="font-medium text-text-primary">Margin %</p>
                                <p>{order.total > 0 ? `${Math.round(((order.total - order.foodCost) / order.total) * 100)}%` : '0%'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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
