'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, patch } from '@/lib/api';
import { API_PATHS, ORDER_STATUS_TRANSITIONS } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface Order {
  id: string;
  channel: string;
  status: string;
  total: number;
  createdAt: string;
  items: { menuItem: { name: string }; quantity: number }[];
}

interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

// Human-readable labels for each filter tab
const FILTER_TABS: { label: string; value: string; description: string }[] = [
  { value: '', label: 'All Orders', description: 'Show every order' },
  { value: 'NEW', label: 'New', description: 'Just came in, not started yet' },
  { value: 'PREPARING', label: 'In Kitchen', description: 'Being prepared right now' },
  { value: 'READY', label: 'Ready', description: 'Cooked and waiting to be picked up' },
  { value: 'COMPLETED', label: 'Done', description: 'Delivered to customer' },
  { value: 'CANCELLED', label: 'Cancelled', description: 'Order was cancelled' },
];

// Human-friendly action labels
const NEXT_ACTION_LABEL: Record<string, string> = {
  NEW: '▶ Start Preparing',
  PREPARING: '✓ Mark Ready',
  READY: '✓ Mark Delivered',
};

function timeElapsed(dateStr: string): { label: string; urgent: boolean; critical: boolean } {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  const label = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return { label, urgent: mins >= 15, critical: mins >= 30 };
}

export default function OpsOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit] = useState(15);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const catParam = selectedCategoryIds.length > 0
        ? '&' + selectedCategoryIds.map((id) => `categoryIds=${encodeURIComponent(id)}`).join('&')
        : '';
      const query = buildQueryString({ status: statusFilter || undefined, page, limit });
      const data = await get(`/api/v1/orders${query}${catParam}`, token);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    get('/api/v1/menu/categories?limit=50', token)
      .then((res) => setCategories(res as MenuCategory[]))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter, page, selectedCategoryIds]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!token) return;
    setUpdatingId(id);
    try {
      await patch(API_PATHS.orders.updateStatus(id), { status: newStatus }, token);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const nextStatus = ORDER_STATUS_TRANSITIONS;
  const activeCount = orders.filter((o) => o.status === 'NEW' || o.status === 'PREPARING').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ShoppingCart className="text-gold" /> Orders
        </h1>
        {activeCount > 0 && (
          <p className="text-sm text-warning font-medium mt-1">
            {activeCount} order{activeCount > 1 ? 's' : ''} still active — needs action
          </p>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(0); }}
            title={tab.description}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all border ${
              statusFilter === tab.value
                ? 'bg-gold text-white border-gold shadow-sm'
                : 'bg-surface-raised text-text-secondary border-border-subtle hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Menu type filter */}
      {categories.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary">Filter by Menu Type</p>
            {selectedCategoryIds.length > 0 && (
              <button onClick={() => setSelectedCategoryIds([])} className="text-xs font-semibold text-[var(--color-gold)] hover:underline">
                Clear
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
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border ${
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
        </div>
      )}

      {loading ? (
        <PageSkeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-12 text-center">
          <CheckCircle size={32} className="mx-auto text-text-tertiary mb-2" />
          <p className="text-sm text-text-secondary">No orders here</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const nextSt = nextStatus[order.status];
              const actionLabel = NEXT_ACTION_LABEL[order.status];
              const isUpdating = updatingId === order.id;
              const { label: elapsed, urgent, critical } = timeElapsed(order.createdAt);
              const isActive = order.status === 'NEW' || order.status === 'PREPARING';
              return (
                <div key={order.id} className={`rounded-3xl border overflow-hidden ${critical && isActive ? 'border-error/50 bg-error-muted/20' : urgent && isActive ? 'border-warning/50 bg-warning-muted/20' : 'border-border-default bg-surface-raised'}`}>
                  <div className="p-4">
                    {/* Top row: status + channel + total */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={order.status} />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary capitalize">
                          {order.channel.toLowerCase()}
                        </span>
                        {critical && isActive && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-error">
                            <AlertCircle size={12} /> Overdue
                          </span>
                        )}
                      </div>
                      <span className="text-base font-bold text-text-primary">{formatCurrency(order.total)}</span>
                    </div>

                    {/* Items */}
                    {order.items?.length > 0 && (
                      <ul className="space-y-0.5 mb-3">
                        {order.items.map((item, i) => (
                          <li key={i} className="text-sm text-text-secondary">
                            {item.quantity}× {item.menuItem?.name}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Footer: time + action button */}
                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                      <span className={`text-xs flex items-center gap-1 font-semibold ${critical && isActive ? 'text-error' : urgent && isActive ? 'text-warning' : 'text-text-tertiary'}`}>
                        <Clock size={12} />
                        {elapsed} ago
                      </span>
                      {nextSt && actionLabel && (
                        <Button
                          size="sm"
                          loading={isUpdating}
                          onClick={() => handleStatusUpdate(order.id, nextSt)}
                        >
                          {actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={() => {}}
            hasMore={orders.length === limit}
          />
        </>
      )}
    </div>
  );
}
