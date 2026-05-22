'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { get, put } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { PageSkeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  HeartHandshake,
  Search,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Clock,
  Phone,
  MessageSquare,
  Mail,
  Users,
  ChevronDown,
} from 'lucide-react';

const CHANNELS = ['CALL', 'WHATSAPP', 'SMS', 'IN_PERSON', 'EMAIL'] as const;
type Channel = (typeof CHANNELS)[number];

const CHANNEL_META: Record<Channel, { label: string; icon: React.ReactNode }> = {
  CALL:      { label: 'Call',       icon: <Phone size={14} /> },
  WHATSAPP:  { label: 'WhatsApp',   icon: <MessageSquare size={14} /> },
  SMS:       { label: 'SMS',        icon: <MessageSquare size={14} /> },
  IN_PERSON: { label: 'In-Person',  icon: <Users size={14} /> },
  EMAIL:     { label: 'Email',      icon: <Mail size={14} /> },
};

interface CustomerRow {
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    totalSpend: number;
    visitCount: number;
    lastSeenAt: string;
  };
  log: {
    id: string;
    engaged: boolean;
    reached?: boolean | null;
    engagedAt?: string;
    channel?: Channel;
    notes?: string;
    engagedBy?: { id: string; name: string };
  } | null;
  orderedToday: boolean;
  order?: { id: string; total: number; createdAt: string } | null;
}

interface ListResponse {
  data: CustomerRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface LocalEdit {
  engaged: boolean;
  reached: boolean | null;
  engagedAt: string;
  channel: Channel | '';
  notes: string;
  saving: boolean;
  saved: boolean;
  error: string;
  open: boolean;
}

export default function EngagementPage() {
  const { user, loading: authLoading } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const [listData, setListData] = useState<ListResponse | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  // Local edit state per customer
  const [edits, setEdits] = useState<Record<string, LocalEdit>>({});

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const url = API_PATHS.engagement.dailyPaged(date, page, limit, search || undefined);
      const data = await get<ListResponse>(url);
      setListData(data);

      // Seed local edits from server data
      setEdits((prev) => {
        const next = { ...prev };
        for (const row of data.data) {
          const cid = row.customer.id;
          if (!next[cid]) {
            next[cid] = {
              engaged: row.log?.engaged ?? false,
              reached: row.log?.reached ?? null,
              engagedAt: row.log?.engagedAt ? row.log.engagedAt.slice(0, 16) : '',
              channel: (row.log?.channel as Channel) ?? '',
              notes: row.log?.notes ?? '',
              saving: false,
              saved: false,
              error: '',
              open: false,
            };
          }
        }
        return next;
      });
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoadingList(false);
    }
  }, [date, page, search]);

  useEffect(() => {
    if (!authLoading && user) fetchList();
  }, [authLoading, user, fetchList]);

  // When date changes reset page and edits
  function handleDateChange(d: string) {
    setDate(d);
    setPage(0);
    setEdits({});
  }

  function handleSearch() {
    setSearch(searchInput);
    setPage(0);
  }

  function patchEdit(customerId: string, patch: Partial<LocalEdit>) {
    setEdits((prev) => ({
      ...prev,
      [customerId]: { ...prev[customerId], ...patch },
    }));
  }

  async function saveEngagement(customerId: string) {
    const edit = edits[customerId];
    if (!edit) return;
    patchEdit(customerId, { saving: true, saved: false, error: '' });
    try {
      await put(API_PATHS.engagement.upsert(customerId), {
        date,
        engaged: edit.engaged,
        reached: edit.engaged ? edit.reached : null,
        engagedAt: edit.engaged && edit.engagedAt ? new Date(edit.engagedAt).toISOString() : undefined,
        channel: edit.engaged && edit.channel ? edit.channel : undefined,
        notes: edit.notes || undefined,
      });
      patchEdit(customerId, { saving: false, saved: true });
      // refresh list silently to update log data
      setTimeout(() => fetchList(), 300);
    } catch (e: unknown) {
      patchEdit(customerId, {
        saving: false,
        error: e instanceof Error ? e.message : 'Save failed',
      });
    }
  }

  if (authLoading) return <PageSkeleton />;
  if (!user) return null;

  // Summary counts
  const totalEngaged = listData?.data.filter((r) => r.log?.engaged).length ?? 0;
  const totalOrdered = listData?.data.filter((r) => r.orderedToday).length ?? 0;
  const totalLogged = listData?.data.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HeartHandshake className="text-[var(--color-gold)]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Daily Engagement</h1>
            <p className="text-sm text-text-secondary">Log your customer touchpoints for the day</p>
          </div>
        </div>
        <input
          type="date"
          value={date}
          max={todayStr}
          onChange={(e) => handleDateChange(e.target.value)}
          className="border border-border-subtle rounded-lg px-3 py-2 text-sm bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
        />
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Showing', value: totalLogged, sub: `of ${listData?.total ?? 0} customers`, color: 'text-text-primary' },
          { label: 'Engaged', value: totalEngaged, sub: 'on this page', color: 'text-success' },
          { label: 'Ordered Today', value: totalOrdered, sub: 'completed orders', color: 'text-[var(--color-gold)]' },
          { label: 'Conversion', value: totalEngaged > 0 ? `${Math.round((totalOrdered / totalEngaged) * 100)}%` : '—', sub: 'engaged → ordered', color: 'text-info' },
        ].map((t) => (
          <div key={t.label} className="bg-surface-raised border border-border-subtle rounded-xl p-4">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">{t.label}</p>
            <p className={`text-2xl font-bold ${t.color}`}>{t.value}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="Search customers…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={handleSearch}>Search</Button>
        {search && (
          <Button variant="ghost" onClick={() => { setSearchInput(''); setSearch(''); }}>Clear</Button>
        )}
      </div>

      {/* List */}
      {loadingList ? (
        <PageSkeleton />
      ) : listError ? (
        <div className="text-center py-12 text-error">{listError}</div>
      ) : !listData || listData.data.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">No customers found.</div>
      ) : (
        <div className="space-y-3">
          {listData.data.map((row) => {
            const cid = row.customer.id;
            const edit = edits[cid] ?? {
              engaged: false, reached: null, engagedAt: '', channel: '' as const, notes: '',
              saving: false, saved: false, error: '', open: false,
            };

            return (
              <div
                key={cid}
                className={`bg-surface-raised border rounded-xl transition-all ${
                  row.log?.engaged ? 'border-success' : 'border-border-subtle'
                }`}
              >
                {/* Customer row header */}
                <div className="flex items-center gap-3 p-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 text-sm font-semibold text-text-secondary uppercase">
                    {row.customer.name.charAt(0)}
                  </div>

                  {/* Customer info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{row.customer.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {row.customer.phone ?? row.customer.email ?? 'No contact'}
                      {' · '}
                      {row.customer.visitCount} visit{row.customer.visitCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Ordered badge */}
                  {row.orderedToday && (
                    <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-gold)] bg-warning-muted px-2 py-1 rounded-full">
                      <ShoppingBag size={12} />
                      Ordered
                    </span>
                  )}

                  {/* Log status badge */}
                  {row.log ? (
                    row.log.engaged ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-success bg-success-muted px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} />
                        {row.log.reached === true ? 'Engaged · Reached' : row.log.reached === false ? 'Engaged · Not Reached' : 'Engaged'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-text-tertiary bg-surface-elevated px-2 py-1 rounded-full">
                        <XCircle size={12} /> Not Engaged
                      </span>
                    )
                  ) : null}

                  {/* Expand toggle */}
                  <button
                    onClick={() => patchEdit(cid, { open: !edit.open })}
                    className="ml-1 text-text-tertiary hover:text-text-primary transition-colors"
                    aria-label="Toggle details"
                  >
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${edit.open ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {/* Expanded form */}
                {edit.open && (
                  <div className="border-t border-border-subtle px-4 pb-4 pt-3 space-y-4">
                    {/* Engaged toggle */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">Did you engage this customer?</span>
                      <div className="flex gap-2 ml-auto">
                        {[true, false].map((val) => (
                          <button
                            key={String(val)}
                            onClick={() => patchEdit(cid, { engaged: val, reached: val ? edit.reached : null, saved: false })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                              edit.engaged === val
                                ? val
                                  ? 'bg-success text-white border-success'
                                  : 'bg-error text-white border-error'
                                : 'bg-surface-elevated text-text-secondary border-border-subtle hover:border-text-tertiary'
                            }`}
                          >
                            {val ? 'Yes' : 'No'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reached toggle — only when engaged */}
                    {edit.engaged && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-text-primary">Were you able to reach them?</span>
                        <div className="flex gap-2 ml-auto">
                          {([true, false] as const).map((val) => (
                            <button
                              key={String(val)}
                              onClick={() => patchEdit(cid, { reached: edit.reached === val ? null : val, saved: false })}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                edit.reached === val
                                  ? val
                                    ? 'bg-success text-white border-success'
                                    : 'bg-error text-white border-error'
                                  : 'bg-surface-elevated text-text-secondary border-border-subtle hover:border-text-tertiary'
                              }`}
                            >
                              {val ? 'Yes' : 'No'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {edit.engaged && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Time engaged */}
                        <div>
                          <label className="block text-xs text-text-tertiary mb-1">
                            <Clock size={12} className="inline mr-1" />Time Engaged
                          </label>
                          <input
                            type="datetime-local"
                            value={edit.engagedAt}
                            max={new Date().toISOString().slice(0, 16)}
                            onChange={(e) => patchEdit(cid, { engagedAt: e.target.value, saved: false })}
                            className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                          />
                        </div>

                        {/* Channel */}
                        <div>
                          <label className="block text-xs text-text-tertiary mb-1">Channel</label>
                          <select
                            value={edit.channel}
                            onChange={(e) => patchEdit(cid, { channel: e.target.value as Channel, saved: false })}
                            className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                          >
                            <option value="">— Select channel —</option>
                            {CHANNELS.map((ch) => (
                              <option key={ch} value={ch}>{CHANNEL_META[ch].label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">Notes (optional)</label>
                      <textarea
                        value={edit.notes}
                        onChange={(e) => patchEdit(cid, { notes: e.target.value, saved: false })}
                        rows={2}
                        placeholder="Add a note about this interaction…"
                        className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] resize-none"
                      />
                    </div>

                    {/* Ordered today indicator */}
                    {row.orderedToday && row.order && (
                      <div className="flex items-center gap-2 text-sm text-[var(--color-gold)] bg-warning-muted rounded-lg px-3 py-2">
                        <ShoppingBag size={16} />
                        <span>
                          Placed a completed order today at{' '}
                          {new Date(row.order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' — '}
                          {formatCurrency(Number(row.order.total))}
                        </span>
                      </div>
                    )}

                    {/* Save button + status */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => saveEngagement(cid)}
                        disabled={edit.saving}
                        className="bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] text-black"
                      >
                        {edit.saving ? 'Saving…' : 'Save'}
                      </Button>
                      {edit.saved && (
                        <span className="text-sm text-success flex items-center gap-1">
                          <CheckCircle2 size={14} /> Saved
                        </span>
                      )}
                      {edit.error && (
                        <span className="text-sm text-error">{edit.error}</span>
                      )}
                      {row.log?.engagedBy && (
                        <span className="text-xs text-text-tertiary ml-auto">
                          Last logged by {row.log.engagedBy.name}
                          {row.log.engagedAt ? ` at ${new Date(row.log.engagedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {listData && listData.pages > 1 && (
        <PaginationControls
          page={page}
          limit={limit}
          onPageChange={setPage}
          hasMore={page < listData.pages - 1}
        />
      )}
    </div>
  );
}
