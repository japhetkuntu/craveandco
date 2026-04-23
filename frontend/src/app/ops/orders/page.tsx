'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, patch } from '@/lib/api';
import { API_PATHS, ORDER_STATUS_FILTERS, ORDER_STATUS_TRANSITIONS } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTime } from '@/lib/utils';
import { ShoppingCart, Filter } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface Order {
  id: string;
  channel: string;
  status: string;
  total: number;
  createdAt: string;
  items: { menuItem: { name: string }; quantity: number }[];
}

export default function OpsOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = buildQueryString({ status: statusFilter || undefined, page, limit });
      const data = await get(`/api/v1/orders${query}`, token);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, statusFilter, page, limit]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!token) return;
    try {
      await patch(API_PATHS.orders.updateStatus(id), { status: newStatus }, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const statuses = ORDER_STATUS_FILTERS;
  const nextStatus = ORDER_STATUS_TRANSITIONS;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <ShoppingCart className="text-gold" /> Orders
      </h1>

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

      {loading ? (
        <PageSkeleton />
      ) : orders.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">No orders found</p>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-text-tertiary">{order.channel}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
                </div>
                <div className="text-sm text-text-secondary space-y-0.5">
                  {order.items?.map((item, i) => (
                    <p key={i}>{item.quantity}x {item.menuItem?.name}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-text-tertiary">{formatTime(order.createdAt)}</span>
                  {nextStatus[order.status] && (
                    <Button size="sm" onClick={() => handleStatusUpdate(order.id, nextStatus[order.status])}>
                      Move to {nextStatus[order.status]}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
