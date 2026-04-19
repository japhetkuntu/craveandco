'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { get, patch } from '@/lib/api';
import { API_PATHS, ORDER_STATUS_FLOW } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { ChefHat, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface OrderItem {
  id: string;
  quantity: number;
  notes?: string;
  menuItem: { name: string };
}

interface Order {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
  notes?: string;
  items: OrderItem[];
}

const statusFlow = ORDER_STATUS_FLOW;

const STATUS_COLORS: Record<string, { bg: string; border: string; header: string; dot: string }> = {
  NEW: { bg: 'bg-info-muted/60', border: 'border-l-blue-500', header: 'text-info', dot: 'bg-info-muted0' },
  PREPARING: { bg: 'bg-amber-50/60', border: 'border-l-amber-500', header: 'text-amber-700', dot: 'bg-amber-500' },
  READY: { bg: 'bg-success-muted/60', border: 'border-l-success', header: 'text-success', dot: 'bg-success' },
};

export default function KitchenLiveBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stationLoad, setStationLoad] = useState<{ station: string; count: number }[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [livePage, setLivePage] = useState(0);
  const [liveLimit, setLiveLimit] = useState(10);
  const [stationPage, setStationPage] = useState(0);
  const [stationLimit, setStationLimit] = useState(10);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      if (!loading) setRefreshing(true);
      const [liveOrders, stations] = await Promise.all([
        get(`/api/v1/kitchen/orders/live${buildQueryString({ page: livePage, limit: liveLimit })}`, token),
        get(`/api/v1/kitchen/station-load${buildQueryString({ page: stationPage, limit: stationLimit })}`, token),
      ]);
      setOrders(liveOrders);
      setStationLoad(stations);
    } catch (err) {
      console.error(err);
      toast('error', 'Unable to refresh kitchen orders', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, livePage, liveLimit, stationPage, stationLimit, loading, toast]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const advanceOrder = async (orderId: string, currentStatus: string) => {
    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus || !token) return;
    try {
      await patch(API_PATHS.kitchen.updateOrderStatus(orderId), { status: nextStatus }, token);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeSince = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
      </div>
    );
  }

  const newOrders = orders.filter((o) => o.status === 'NEW');
  const preparing = orders.filter((o) => o.status === 'PREPARING');
  const ready = orders.filter((o) => o.status === 'READY');

  const columns = [
    { key: 'NEW', label: 'New', orders: newOrders },
    { key: 'PREPARING', label: 'Preparing', orders: preparing },
    { key: 'READY', label: 'Ready', orders: ready },
  ];

  const mobileOrders = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <ChefHat className="text-gold" /> Kitchen
          </h1>
          <p className="text-xs text-text-tertiary mt-0.5">
            {orders.length} active · auto-refreshes every 10s
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl bg-surface-elevated text-text-secondary hover:bg-gold-muted hover:text-gold transition-all"
          aria-label="Refresh kitchen orders"
        >
          {refreshing ? (
            <span className="animate-spin inline-block">
              <RefreshCw size={18} />
            </span>
          ) : (
            <RefreshCw size={18} />
          )}
        </button>
      </div>

      {/* Station Load Pills */}
      {stationLoad.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {stationLoad.map((s) => (
            <div key={s.station} className="flex-shrink-0 bg-surface-raised rounded-xl border border-border-subtle px-3 py-1.5 flex items-center gap-2">
              <span className="text-xs text-text-secondary">{s.station}</span>
              <span className="text-sm font-bold text-gold">{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex gap-1 bg-surface-elevated rounded-xl p-0.5">
        {[{ key: 'ALL', label: 'All', count: orders.length }, ...columns.map(c => ({ key: c.key, label: c.label, count: c.orders.length }))].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key ? 'bg-surface-raised text-gold shadow-sm' : 'text-text-secondary'
            }`}
          >
            {tab.label} <span className="opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Mobile Order List */}
      <div className="md:hidden space-y-2">
        {mobileOrders.map(order => (
          <KitchenOrderCard key={order.id} order={order} onAdvance={advanceOrder} getTimeSince={getTimeSince} />
        ))}
        {mobileOrders.length === 0 && (
          <div className="text-center py-12 text-text-tertiary text-sm">No orders in this status</div>
        )}
      </div>

      {/* Desktop 3-Column Kanban */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colors = STATUS_COLORS[col.key];
          return (
            <div key={col.key} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                <h2 className={`text-sm font-bold uppercase tracking-wide ${colors.header}`}>
                  {col.label}
                </h2>
                <span className={`text-xs font-semibold ${colors.header} opacity-60`}>
                  ({col.orders.length})
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {col.orders.map(order => (
                  <KitchenOrderCard key={order.id} order={order} onAdvance={advanceOrder} getTimeSince={getTimeSince} />
                ))}
                {col.orders.length === 0 && (
                  <div className={`${colors.bg} rounded-2xl border border-dashed border-border-default p-6 text-center text-text-tertiary text-xs`}>
                    No orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <PaginationControls
        page={livePage}
        limit={liveLimit}
        onPageChange={setLivePage}
        onLimitChange={(value) => { setLiveLimit(value); setLivePage(0); }}
        hasMore={orders.length === liveLimit}
      />
    </div>
  );
}

function KitchenOrderCard({
  order,
  onAdvance,
  getTimeSince,
}: {
  order: Order;
  onAdvance: (id: string, status: string) => void;
  getTimeSince: (d: string) => string;
}) {
  const nextStatus = statusFlow[order.status];
  const colors = STATUS_COLORS[order.status] || STATUS_COLORS.NEW;
  const timeSince = getTimeSince(order.createdAt);
  const isUrgent = (Date.now() - new Date(order.createdAt).getTime()) > 15 * 60000;

  return (
    <div className={`bg-surface-raised rounded-2xl border-l-4 ${colors.border} shadow-sm p-4 transition-all ${isUrgent ? 'ring-2 ring-red-100' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-surface-elevated text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
            #{order.id.slice(-4).toUpperCase()}
          </span>
          <span className="text-[10px] text-text-tertiary uppercase">{order.channel.replace('_', ' ')}</span>
        </div>
        <span className={`text-xs font-semibold flex items-center gap-1 ${isUrgent ? 'text-error' : 'text-text-tertiary'}`}>
          <Clock size={12} />
          {timeSince}
        </span>
      </div>

      <ul className="space-y-1.5 my-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="bg-gold-muted text-gold text-xs font-bold rounded-lg px-1.5 py-0.5 min-w-[24px] text-center">
                {item.quantity}
              </span>
              <span className="text-sm font-medium text-text-primary">{item.menuItem.name}</span>
            </div>
            {item.notes && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md italic flex-shrink-0">
                {item.notes}
              </span>
            )}
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="text-xs text-text-tertiary italic mb-3 bg-surface-base rounded-lg px-3 py-1.5">
          📝 {order.notes}
        </p>
      )}

      {nextStatus && (
        <button
          onClick={() => onAdvance(order.id, order.status)}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.97] ${
            order.status === 'NEW'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-success text-white hover:bg-success'
          }`}
        >
          Move to {nextStatus.replace('_', ' ')} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
