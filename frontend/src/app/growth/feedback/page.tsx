'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { MessageSquare, CheckCircle, Plus, User, Search } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface FeedbackTicket {
  id: string;
  status: string;
  subject: string;
  body?: string;
  createdAt: string;
  resolution?: string;
  resolvedAt?: string;
  customer: { id: string; name: string; phone?: string };
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  loyaltyPoints?: number;
}

export default function GrowthFeedbackPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showResolve, setShowResolve] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  // New ticket form
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [resolveText, setResolveText] = useState('');

  const fetchData = async () => {
    if (!token) return;
    try {
      const [t, c, s] = await Promise.all([
        get(`/api/v1/feedback/tickets${buildQueryString({ status: filter || undefined, search: search.trim() || undefined, page, limit })}`, token),
        get('/api/v1/customers', token),
        get('/api/v1/feedback/tickets/stats', token),
      ]);
      setTickets(t);
      setCustomers(c);
      setOpenCount((s.open ?? 0) + (s.inProgress ?? 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(0); }, [filter, search]);
  useEffect(() => { fetchData(); }, [token, filter, search, page, limit]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCustomerId || !newSubject.trim()) return;
    setSaving(true);
    try {
      await post('/api/v1/feedback/tickets', {
        customerId: newCustomerId,
        subject: newSubject.trim(),
        body: newBody.trim() || undefined,
      }, token);
      setShowNew(false);
      setNewCustomerId(''); setNewSubject(''); setNewBody('');
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!token || !resolveText.trim()) return;
    setSaving(true);
    try {
      await post(`/api/v1/feedback/tickets/${id}/resolve`, { resolution: resolveText.trim() }, token);
      setShowResolve(null);
      setResolveText('');
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = tickets;

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="text-gold" /> Feedback
          </h1>
          <p className="text-xs text-text-tertiary mt-0.5">{openCount} open ticket{openCount !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> New Ticket
        </Button>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, message or customer…"
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border-default bg-surface-input text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f ? 'bg-[var(--color-gold)] text-white' : 'bg-surface-elevated text-text-secondary'
              }`}
            >
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No feedback tickets</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {filtered.map(ticket => (
              <div key={ticket.id} className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-text-primary truncate">{ticket.subject}</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="text-xs text-text-tertiary flex items-center gap-1">
                      <User size={10} /> {ticket.customer?.name}
                      {ticket.customer?.phone && ` · ${ticket.customer.phone}`}
                    </p>
                  </div>
                </div>
                {ticket.body && (
                  <p className="text-sm text-text-secondary mt-2 bg-surface-base rounded-xl p-3">{ticket.body}</p>
                )}
                {ticket.resolution && (
                  <div className="mt-2 bg-success-muted rounded-xl p-3">
                    <p className="text-xs font-medium text-success">Resolution:</p>
                    <p className="text-sm text-success mt-0.5">{ticket.resolution}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle">
                  <span className="text-xs text-text-tertiary">
                    {new Date(ticket.createdAt).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {ticket.status !== 'RESOLVED' && (
                    <Button size="sm" onClick={() => { setShowResolve(ticket.id); setResolveText(''); }}>
                      <CheckCircle size={14} /> Resolve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <PaginationControls
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(value) => { setLimit(value); setPage(0); }}
          hasMore={tickets.length === limit}
        />
      </>
      )}

      {showNew && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">New Feedback Ticket</h2>
                <p className="text-sm text-text-secondary mt-1">Log a customer complaint or suggestion.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowNew(false); setNewCustomerId(''); setNewSubject(''); setNewBody(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form id="new-ticket-form" onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Customer</label>
                  <select
                    value={newCustomerId}
                    onChange={e => setNewCustomerId(e.target.value)}
                    required
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.phone ? ` (${c.phone})` : ''}{c.loyaltyPoints != null ? ` — ${c.loyaltyPoints} pts` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Subject"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  required
                  placeholder="What is the feedback about?"
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    Details <span className="text-text-tertiary font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={newBody}
                    onChange={e => setNewBody(e.target.value)}
                    placeholder="Describe the issue or feedback in more detail"
                    rows={3}
                    className="w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)] resize-none"
                  />
                </div>
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowNew(false); setNewCustomerId(''); setNewSubject(''); setNewBody(''); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="new-ticket-form" loading={saving}>Submit</Button>
            </div>
          </div>
        </div>
      )}

      {!!showResolve && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Resolve Ticket</h2>
                <p className="text-sm text-text-secondary mt-1">Describe how the issue was handled.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowResolve(null); setResolveText(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">How was it resolved?</label>
                <textarea
                  value={resolveText}
                  onChange={e => setResolveText(e.target.value)}
                  placeholder="Describe how the issue was resolved or what action was taken"
                  rows={4}
                  className="w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)] resize-none"
                />
              </div>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowResolve(null); setResolveText(''); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => showResolve && handleResolve(showResolve)} loading={saving} disabled={!resolveText.trim()}>
                <CheckCircle size={16} /> Resolve
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
