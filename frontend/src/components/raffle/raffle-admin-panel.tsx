'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Users,
  Flame,
  ShoppingBag,
  TrendingUp,
  Phone,
  Copy,
  Check,
  Gift,
  Trophy,
  Search,
  RefreshCcw,
  CheckCircle2,
  Lock,
  RotateCcw,
  Receipt,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination';
import { formatCurrency } from '@/lib/utils';

interface RaffleStats {
  totalEntries: number;
  totalSpins: number;
  spinsToday: number;
  entriesToday: number;
  ordersWithCode: number;
  rewardsRedeemed: number;
  pendingRewards: number;
  redeemedToday: number;
  conversionRate: number;
  redemptionRate: number;
  rewardBreakdown: { rewardType: string; count: number }[];
}

interface RaffleSpin {
  id: string;
  rewardType: string;
  rewardLabel: string;
  wonAt: string;
  redeemedAt: string | null;
  redeemedBy: { id: string; name: string } | null;
  redeemedOrderId: string | null;
  redemptionNote: string | null;
}

interface RaffleEntry {
  id: string;
  phone: string;
  name: string;
  accessCode: string;
  spinCount: number;
  dailySpinCount: number;
  lastSpinAt: string | null;
  createdAt: string;
  updatedAt: string;
  pendingRewards: number;
  latestReward:
    | {
        id: string;
        type: string;
        label: string;
        wonAt: string;
        redeemedAt: string | null;
        redeemedBy: { id: string; name: string } | null;
        redeemedOrderId: string | null;
        redemptionNote: string | null;
      }
    | null;
  recentSpins: RaffleSpin[];
  customer: { id: string; name: string; phone: string } | null;
  ordersUsingCode: number;
  ordersTotal: number;
  converted: boolean;
}

interface EntriesResponse {
  data: RaffleEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const REWARD_META: Record<string, { label: string; emoji: string; tone: string }> = {
  FIFTY_PERCENT_FIRST_MEAL: { label: '50% off meal', emoji: '🎉', tone: 'bg-[#fff0de] text-[#b5451b]' },
  TEN_PERCENT: { label: '10% off', emoji: '🔥', tone: 'bg-[#fde8d0] text-[#9a4d18]' },
  FIVE_PERCENT: { label: '5% off', emoji: '😊', tone: 'bg-[#fef5e6] text-[#82624a]' },
  FREE_WATER: { label: 'Free water', emoji: '🥤', tone: 'bg-[#e8eff6] text-[#3a4f63]' },
  FREE_DELIVERY: { label: 'Free delivery', emoji: '🚚', tone: 'bg-[#26130f] text-[#ffd9a8]' },
};

function rewardChip(type: string, opts?: { redeemed?: boolean }) {
  const meta = REWARD_META[type] ?? { label: type, emoji: '🎁', tone: 'bg-bg-soft text-text-primary' };
  if (opts?.redeemed) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-2.5 py-1 text-[11px] font-semibold text-text-secondary line-through opacity-70"
        title="Reward already redeemed"
      >
        <Lock size={10} />
        <span className="not-italic no-underline">{meta.label}</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}
    >
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function RaffleAdminPanel() {
  const { token } = useAuth();
  const [stats, setStats] = useState<RaffleStats | null>(null);
  const [entries, setEntries] = useState<RaffleEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<RaffleEntry | null>(null);

  const fetchData = useCallback(
    async (nextPage: number, nextSearch: string) => {
      if (!token) return;
      try {
        setRefreshing(true);
        const [statsRes, entriesRes] = await Promise.all([
          get<RaffleStats>(API_PATHS.raffleAdmin.stats, token),
          get<EntriesResponse>(API_PATHS.raffleAdmin.entries(nextPage, 20, nextSearch || undefined), token),
        ]);
        setStats(statsRes);
        setEntries(entriesRes.data);
        setPagination(entriesRes.pagination);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load raffle data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void fetchData(1, '');
  }, [fetchData]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    void fetchData(1, searchInput.trim());
  };

  const handlePageChange = (page: number) => {
    void fetchData(page, search);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      /* noop */
    }
  };

  const rewardBreakdown = useMemo(() => {
    const total = stats?.rewardBreakdown.reduce((sum, row) => sum + row.count, 0) ?? 0;
    return (
      stats?.rewardBreakdown.map((row) => ({
        ...row,
        meta: REWARD_META[row.rewardType] ?? { label: row.rewardType, emoji: '🎁', tone: '' },
        pct: total > 0 ? Math.round((row.count / total) * 100) : 0,
      })) ?? []
    );
  }, [stats]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">Engagement</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-text-primary sm:text-3xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#b5451b] to-[#e8a45a] text-white shadow">
              <Sparkles size={18} />
            </span>
            Daily Raffle
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Track WhatsApp raffle entries, spins, and conversions in real time.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => void fetchData(pagination.page, search)}
          disabled={refreshing}
          className="self-start sm:self-auto"
        >
          <RefreshCcw size={14} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {error && (
        <Card className="border-error/30 bg-error/5 text-sm text-error">{error}</Card>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total Entries"
          value={stats?.totalEntries ?? 0}
          icon={<Users size={18} />}
          severity="healthy"
        />
        <KPICard
          title="Spins Today"
          value={stats?.spinsToday ?? 0}
          icon={<Flame size={18} />}
        />
        <KPICard
          title="Rewards Redeemed"
          value={stats?.rewardsRedeemed ?? 0}
          icon={<CheckCircle2 size={18} />}
          severity="healthy"
        />
        <KPICard
          title="Orders w/ Code"
          value={stats?.ordersWithCode ?? 0}
          icon={<ShoppingBag size={18} />}
        />
        <KPICard
          title="Conversion"
          value={`${stats?.conversionRate ?? 0}%`}
          icon={<TrendingUp size={18} />}
          severity={
            (stats?.conversionRate ?? 0) >= 20
              ? 'healthy'
              : (stats?.conversionRate ?? 0) >= 5
                ? 'warning'
                : 'critical'
          }
        />
      </section>

      {rewardBreakdown.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
                <Trophy size={16} className="text-[#b5451b]" />
                Reward distribution
              </h2>
              <p className="text-xs text-text-secondary">All-time spins by reward.</p>
            </div>
            <span className="rounded-full bg-bg-soft px-3 py-1 text-xs font-semibold text-text-secondary">
              {stats?.totalSpins ?? 0} spins
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {rewardBreakdown.map((row) => (
              <div
                key={row.rewardType}
                className="rounded-2xl border border-border bg-white p-3"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-base">{row.meta.emoji}</span>
                    {row.meta.label}
                  </span>
                  <span>{row.pct}%</span>
                </div>
                <p className="mt-2 font-mono text-lg font-bold text-text-primary">{row.count}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-soft">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#b5451b] to-[#e8a45a]"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary">Recent raffle requests</h2>
            <p className="text-xs text-text-secondary">
              Sorted by latest activity · {pagination.total} total
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
            <div className="flex flex-1 items-center rounded-full border border-border bg-white px-3 py-2 focus-within:border-[#b5451b]">
              <Search size={14} className="mr-2 text-text-secondary" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Phone, name, or code"
                className="w-full bg-transparent text-sm outline-none placeholder:text-text-secondary"
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
          </form>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={28} />}
            title="No raffle entries yet"
            description="Once customers register on the raffle page, they'll appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 py-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff0de] to-[#fbe9d3] text-base font-bold text-[#b5451b]">
                      {entry.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{entry.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-text-secondary">
                        <Phone size={11} /> {entry.phone}
                        {entry.customer && (
                          <span className="ml-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                            customer
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(entry.accessCode)}
                    className="group inline-flex items-center gap-1.5 rounded-lg bg-bg-soft px-2.5 py-1.5 font-mono text-xs font-bold text-text-primary transition hover:bg-[#fff0de] hover:text-[#b5451b]"
                    title="Copy access code"
                  >
                    {entry.accessCode}
                    {copiedCode === entry.accessCode ? (
                      <Check size={12} className="text-success" />
                    ) : (
                      <Copy size={12} className="opacity-60 group-hover:opacity-100" />
                    )}
                  </button>
                  <p className="mt-1 text-[11px] text-text-secondary">
                    {entry.spinCount} spin{entry.spinCount === 1 ? '' : 's'} · last {timeAgo(entry.lastSpinAt)}
                  </p>
                </div>

                <div className="min-w-0">
                  {entry.latestReward ? (
                    <div className="flex flex-col gap-1">
                      {rewardChip(entry.latestReward.type, {
                        redeemed: !!entry.latestReward.redeemedAt,
                      })}
                      <span className="text-[11px] text-text-secondary">
                        {entry.latestReward.redeemedAt ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 size={10} /> redeemed {timeAgo(entry.latestReward.redeemedAt)}
                          </span>
                        ) : (
                          <>won {timeAgo(entry.latestReward.wonAt)}</>
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-secondary">No spins yet</span>
                  )}
                </div>

                <div className="flex flex-col items-start gap-1 sm:items-end">
                  {entry.converted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
                      <ShoppingBag size={11} /> {entry.ordersUsingCode} order
                      {entry.ordersUsingCode === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning">
                      <Gift size={11} /> Awaiting redemption
                    </span>
                  )}
                  {entry.pendingRewards > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0de] px-2 py-0.5 text-[10px] font-semibold text-[#b5451b]">
                      <Clock size={9} /> {entry.pendingRewards} pending
                    </span>
                  )}
                  {entry.ordersTotal > 0 && (
                    <span className="text-[11px] font-semibold text-text-primary">
                      {formatCurrency(entry.ordersTotal)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    className="text-[11px] font-semibold text-[#b5451b] hover:underline"
                  >
                    {entry.pendingRewards > 0 ? 'Redeem →' : 'View history'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-4">
            <PaginationControls
              page={pagination.page}
              limit={pagination.limit}
              hasMore={pagination.page < pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      {selectedEntry && (
        <EntryHistoryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onChanged={() => {
            void fetchData(pagination.page, search);
          }}
        />
      )}
    </div>
  );
}

function EntryHistoryModal({
  entry,
  onClose,
  onChanged,
}: {
  entry: RaffleEntry;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeRedeemId, setActiveRedeemId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [orderRef, setOrderRef] = useState('');

  const handleRedeem = async (spinId: string) => {
    if (!token) return;
    setPendingId(spinId);
    setErrorMsg(null);
    try {
      await post(
        API_PATHS.raffleAdmin.redeem(spinId),
        {
          orderId: orderRef.trim() || undefined,
          note: note.trim() || undefined,
        },
        token,
      );
      setActiveRedeemId(null);
      setNote('');
      setOrderRef('');
      onChanged();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not redeem reward.');
    } finally {
      setPendingId(null);
    }
  };

  const handleUnredeem = async (spinId: string) => {
    if (!token) return;
    const confirmed = window.confirm('Mark this reward as not redeemed?');
    if (!confirmed) return;
    setPendingId(spinId);
    setErrorMsg(null);
    try {
      await post(API_PATHS.raffleAdmin.unredeem(spinId), {}, token);
      onChanged();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not undo redemption.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#26130f] via-[#3a1f17] to-[#b5451b] px-6 py-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/70">Raffle entry</p>
          <h3 className="mt-1 text-xl font-bold">{entry.name}</h3>
          <p className="text-sm text-white/80">{entry.phone}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-bold">
            {entry.accessCode}
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Spins" value={entry.spinCount} />
            <Stat label="Orders" value={entry.ordersUsingCode} />
            <Stat label="Spent" value={formatCurrency(entry.ordersTotal)} />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
              {errorMsg}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Rewards & redemption
            </p>
            {entry.recentSpins.length === 0 ? (
              <p className="text-sm text-text-secondary">No spins yet.</p>
            ) : (
              <ul className="space-y-2">
                {entry.recentSpins.map((spin) => {
                  const isRedeemed = !!spin.redeemedAt;
                  const isOpen = activeRedeemId === spin.id;
                  return (
                    <li
                      key={spin.id}
                      className={`rounded-2xl border px-3 py-3 ${
                        isRedeemed
                          ? 'border-border bg-bg-soft opacity-80'
                          : 'border-[#fbe9d3] bg-[#fffaf2]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          {rewardChip(spin.rewardType, { redeemed: isRedeemed })}
                          <span className="text-[11px] text-text-secondary">
                            won {timeAgo(spin.wonAt)}
                          </span>
                        </div>
                        {isRedeemed ? (
                          <button
                            type="button"
                            onClick={() => handleUnredeem(spin.id)}
                            disabled={pendingId === spin.id}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-text-secondary hover:text-error"
                            title="Undo redemption"
                          >
                            <RotateCcw size={11} /> Undo
                          </button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveRedeemId(isOpen ? null : spin.id);
                              setNote('');
                              setOrderRef('');
                              setErrorMsg(null);
                            }}
                          >
                            {isOpen ? 'Cancel' : 'Redeem'}
                          </Button>
                        )}
                      </div>

                      {isRedeemed && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary">
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 size={11} /> Redeemed {timeAgo(spin.redeemedAt)}
                          </span>
                          {spin.redeemedBy && <span>by {spin.redeemedBy.name}</span>}
                          {spin.redeemedOrderId && (
                            <span className="inline-flex items-center gap-1">
                              <Receipt size={11} /> #{spin.redeemedOrderId.slice(-6).toUpperCase()}
                            </span>
                          )}
                          {spin.redemptionNote && (
                            <span className="w-full italic">“{spin.redemptionNote}”</span>
                          )}
                        </div>
                      )}

                      {!isRedeemed && isOpen && (
                        <div className="mt-3 space-y-2 rounded-xl border border-border bg-white p-3">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                            Link order ID <span className="text-text-secondary/70">(optional)</span>
                          </label>
                          <input
                            value={orderRef}
                            onChange={(e) => setOrderRef(e.target.value)}
                            placeholder="e.g. clx123abc..."
                            className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#b5451b]"
                          />
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                            Note <span className="text-text-secondary/70">(optional)</span>
                          </label>
                          <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Applied to WhatsApp order #42"
                            maxLength={280}
                            className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#b5451b]"
                          />
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleRedeem(spin.id)}
                            disabled={pendingId === spin.id}
                          >
                            <CheckCircle2 size={13} className="mr-1" />
                            {pendingId === spin.id ? 'Marking…' : 'Mark as redeemed'}
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Button onClick={onClose} variant="ghost" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-bg-soft px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}
