'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { get, patch } from '@/lib/api';
import { API_PATHS, ORDER_STATUS_FLOW } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { ChefHat, RefreshCw, Clock, CheckCircle2, Bell } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface MenuOptionValue { id: string; label: string }
interface MenuOption { id: string; name: string; values: MenuOptionValue[] }
interface SelectedOption { optionId: string; values: string[] }
interface OrderItem {
  id: string; quantity: number; notes?: string;
  selectedOptions?: SelectedOption[];
  menuItem: { name: string; options?: MenuOption[] };
}
interface Order {
  id: string; channel: string; status: string; createdAt: string;
  notes?: string; items: OrderItem[];
}

const formatSelectedOptions = (menuItem: OrderItem['menuItem'], selectedOptions?: SelectedOption[]) => {
  if (!selectedOptions?.length || !menuItem?.options?.length) return [];
  const optionMap = new Map(menuItem.options.map((o) => [o.id, o]));
  return selectedOptions.flatMap((sel) => {
    const opt = optionMap.get(sel.optionId);
    if (!opt) return [];
    const labels = opt.values.filter((v) => sel.values.includes(v.id)).map((v) => v.label);
    return labels.length ? [`${opt.name}: ${labels.join(', ')}`] : [];
  });
};

const statusFlow = ORDER_STATUS_FLOW;

const TABS = [
  { key: 'ALL', label: 'All', emoji: '📋' },
  { key: 'NEW', label: 'New', emoji: '🔔' },
  { key: 'PREPARING', label: 'Cooking', emoji: '🔥' },
  { key: 'READY', label: 'Ready', emoji: '✅' },
];

const STATUS_CONFIG: Record<string, { headerBg: string; borderColor: string; btnClass: string; btnLabel: string }> = {
  NEW: {
    headerBg: 'bg-blue-50 border-b border-blue-100',
    borderColor: 'border-l-blue-500',
    btnClass: 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white',
    btnLabel: '🔥  Start Cooking',
  },
  PREPARING: {
    headerBg: 'bg-amber-50 border-b border-amber-100',
    borderColor: 'border-l-amber-500',
    btnClass: 'bg-success hover:brightness-110 active:scale-95 text-white',
    btnLabel: '✅  Mark as Ready',
  },
  READY: {
    headerBg: 'bg-green-50 border-b border-green-100',
    borderColor: 'border-l-green-500',
    btnClass: '',
    btnLabel: '',
  },
};

function getTimeSince(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function KitchenLiveBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setRefreshing(true);
    try {
      const data = await get(`/api/v1/kitchen/orders/live${buildQueryString({ page: 0, limit: 50 })}`, token);
      setOrders(data);
    } catch (err) {
      if (!silent) toast('error', 'Could not refresh orders', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchOrders(true);
    const iv = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  const advanceOrder = async (orderId: string, currentStatus: string) => {
    const next = statusFlow[currentStatus];
    if (!next || !token || advancingId) return;
    setAdvancingId(orderId);
    try {
      await patch(API_PATHS.kitchen.updateOrderStatus(orderId), { status: next }, token);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: next } : o)));
    } catch (err) {
      toast('error', 'Could not update order', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setAdvancingId(null);
    }
  };

  const counts = {
    ALL: orders.length,
    NEW: orders.filter((o) => o.status === 'NEW').length,
    PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
    READY: orders.filter((o) => o.status === 'READY').length,
  };
  const urgentCount = orders.filter(
    (o) => (o.status === 'NEW' || o.status === 'PREPARING') &&
      Date.now() - new Date(o.createdAt).getTime() > 15 * 60000
  ).length;
  const visibleOrders = activeTab === 'ALL' ? orders : orders.filter((o) => o.status === activeTab);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-[var(--color-gold)] border-t-transparent animate-spin" />
        <p className="text-text-secondary text-sm font-medium">Loading orders…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <ChefHat className="text-[var(--color-gold)]" size={22} /> Kitchen
          </h1>
          <p className="text-xs text-text-tertiary mt-0.5">{orders.length} active · refreshes every 10s</p>
        </div>
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-error-muted border border-error/30 px-3 py-1 text-xs font-bold text-error animate-pulse">
              <Bell size={12} /> {urgentCount} urgent
            </span>
          )}
          <button
            onClick={() => fetchOrders()}
            disabled={refreshing}
            className="p-2.5 rounded-2xl bg-surface-elevated text-text-secondary hover:text-[var(--color-gold)] transition-colors disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-1 bg-surface-elevated rounded-2xl p-1">
        {TABS.map((tab) => {
          const count = counts[tab.key as keyof typeof counts];
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-semibold transition-all gap-0.5 ${
                active ? 'bg-surface-raised text-[var(--color-gold)] shadow-sm' : 'text-text-secondary'
              }`}
            >
              <span className="text-base">{tab.emoji}</span>
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                active ? 'bg-[var(--color-gold)] text-white' : 'bg-surface-raised text-text-tertiary'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {visibleOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CheckCircle2 size={52} className="text-success opacity-30" />
          <p className="text-base font-semibold text-text-secondary">
            {activeTab === 'ALL' ? 'No active orders right now' : `No ${activeTab.toLowerCase()} orders`}
          </p>
          <p className="text-sm text-text-tertiary">New orders appear here automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <OrderCard key={order.id} order={order} onAdvance={advanceOrder} isAdvancing={advancingId === order.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onAdvance, isAdvancing }: {
  order: Order; onAdvance: (id: string, status: string) => void; isAdvancing: boolean;
}) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
  const next = statusFlow[order.status];
  const urgent = Date.now() - new Date(order.createdAt).getTime() > 15 * 60000;
  const time = getTimeSince(order.createdAt);

  return (
    <div className={`rounded-3xl border-2 border-l-4 bg-surface-raised overflow-hidden ${config.borderColor} ${urgent ? 'border-error/30 ring-2 ring-error/20' : 'border-border-default'}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between gap-2 ${config.headerBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded-xl bg-white/80 px-2.5 py-1 text-sm font-black text-text-primary tracking-widest">
            #{order.id.slice(-4).toUpperCase()}
          </span>
          <span className="text-xs font-medium text-text-secondary capitalize truncate">
            {order.channel.replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
        <span className={`shrink-0 flex items-center gap-1 text-xs font-bold ${urgent ? 'text-error' : 'text-text-secondary'}`}>
          <Clock size={11} /> {time}
          {urgent && ' ⚠️'}
        </span>
      </div>

      {/* Items list */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        {order.items.map((item) => {
          const opts = formatSelectedOptions(item.menuItem, item.selectedOptions);
          return (
            <div key={item.id} className="flex items-start gap-3">
              <span className="shrink-0 w-9 h-9 rounded-xl bg-[var(--color-gold)] text-white text-base font-black flex items-center justify-center">
                {item.quantity}
              </span>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm font-bold text-text-primary leading-tight">{item.menuItem.name}</p>
                {opts.length > 0 && (
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">{opts.join(' · ')}</p>
                )}
                {item.notes && (
                  <span className="inline-block mt-1 text-[11px] italic text-warning bg-warning-muted border border-warning/20 px-2 py-0.5 rounded-lg">
                    📝 {item.notes}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {order.notes && (
          <div className="mt-1 rounded-xl bg-surface-base px-3 py-2 text-xs text-text-secondary italic leading-snug">
            🗒 {order.notes}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="px-4 pb-4 pt-2">
        {next && config.btnLabel ? (
          <button
            onClick={() => onAdvance(order.id, order.status)}
            disabled={isAdvancing}
            className={`w-full h-14 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${config.btnClass} disabled:opacity-60`}
          >
            {isAdvancing ? (
              <><RefreshCw size={18} className="animate-spin" /> Updating…</>
            ) : config.btnLabel}
          </button>
        ) : (
          <div className="w-full h-12 rounded-2xl bg-success-muted border border-success/20 flex items-center justify-center gap-2 text-success text-sm font-semibold">
            <CheckCircle2 size={18} /> Ready for pickup
          </div>
        )}
      </div>
    </div>
  );
}
