'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination';
import { MessageSquare, CheckCircle, Plus, X, User } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showResolve, setShowResolve] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
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
      const [t, c] = await Promise.all([
        get(`/api/v1/feedback/tickets${buildQueryString({ page, limit })}`, token),
        get('/api/v1/customers', token),
      ]);
      setTickets(t);
      setCustomers(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token, page, limit]);

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

  const filtered = filter
    ? tickets.filter(t => t.status === filter)
    : tickets;

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  const openCount = tickets.filter(t => t.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="text-gold" /> Feedback
          </h1>
          <p className="text-xs text-text-tertiary mt-0.5">{openCount} open tickets</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> New Ticket
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f ? 'bg-gold text-white' : 'bg-surface-elevated text-text-secondary'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
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
              <Card key={ticket.id}>
              <CardContent className="p-4">
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
              </CardContent>
            </Card>
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

      {/* New Ticket Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-raised rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">New Feedback Ticket</h2>
              <button onClick={() => setShowNew(false)} className="text-text-tertiary hover:text-text-secondary p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <select
                value={newCustomerId}
                onChange={e => setNewCustomerId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl border border-border-default bg-surface-raised text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.phone ? ` (${c.phone})` : ''}{c.loyaltyPoints != null ? ` — ${c.loyaltyPoints} pts` : ''}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                required
                placeholder="Subject *"
                className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
              />
              <textarea
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
                placeholder="Details (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none resize-none"
              />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm">Cancel</button>
                <Button type="submit" loading={saving} className="flex-1">Submit</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolve && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-raised rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <h2 className="text-lg font-bold text-text-primary mb-4">Resolve Ticket</h2>
            <textarea
              autoFocus
              value={resolveText}
              onChange={e => setResolveText(e.target.value)}
              placeholder="What was the resolution?"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowResolve(null)} className="flex-1 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm">Cancel</button>
              <Button onClick={() => handleResolve(showResolve)} loading={saving} disabled={!resolveText.trim()} className="flex-1">
                <CheckCircle size={16} /> Resolve
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
