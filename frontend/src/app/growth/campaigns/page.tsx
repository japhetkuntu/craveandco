'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Megaphone, Plus, Send } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  message: string;
  sentCount: number;
  openCount: number;
  redeemCount: number;
  createdAt: string;
}

export default function GrowthCampaignsPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'PROMOTION', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (!token) return;
    get(`/api/v1/campaigns${buildQueryString({ page, limit })}`, token)
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, limit]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const c = await post('/api/v1/campaigns', form, token);
      setCampaigns((prev) => [c, ...prev]);
      setShowForm(false);
      setForm({ name: '', type: 'PROMOTION', message: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunch = async (id: string) => {
    if (!token) return;
    try {
      await post(`/api/v1/campaigns/${id}/launch`, {}, token);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'RUNNING' } : c)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Megaphone className="text-gold" /> Campaigns
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Campaign
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">New Campaign</h2>
                <p className="text-sm text-text-secondary mt-1">Send a message to your customer base.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowForm(false); setForm({ name: '', type: 'PROMOTION', message: '' }); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form id="new-campaign-form" onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Campaign Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Weekend Special, Birthday Reward"
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Campaign Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="BIRTHDAY">Birthday — send on customer birthdays</option>
                    <option value="REACTIVATION">Win-Back — bring back inactive customers</option>
                    <option value="PROMOTION">Promotion — special offer or discount</option>
                    <option value="CUSTOM">Custom — any other message</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Write the message your customers will receive..."
                    rows={4}
                    className="w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)] resize-none"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setForm({ name: '', type: 'PROMOTION', message: '' }); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="new-campaign-form" loading={submitting}>Create Campaign</Button>
            </div>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">No campaigns created yet</p>
      ) : (
        <>
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-text-tertiary">{c.type}</span>
                    </div>
                  </div>
                  {c.status === 'DRAFT' && (
                    <Button size="sm" onClick={() => handleLaunch(c.id)}>
                      <Send size={14} /> Launch
                    </Button>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-2">{c.message}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-secondary">
                  {c.status !== 'DRAFT' && c.sentCount > 0 ? (
                    <>
                      <span>Sent: <span className="font-semibold text-text-primary">{c.sentCount}</span></span>
                      <span>Opened: <span className="font-semibold text-text-primary">{c.openCount}</span> ({Math.round(c.openCount / c.sentCount * 100)}%)</span>
                      <span>Redeemed: <span className="font-semibold text-text-primary">{c.redeemCount}</span> ({Math.round(c.redeemCount / c.sentCount * 100)}%)</span>
                    </>
                  ) : c.status === 'DRAFT' ? (
                    <span className="text-text-tertiary italic">Not yet launched</span>
                  ) : (
                    <span className="text-text-tertiary">Sent: {c.sentCount} — awaiting engagement data</span>
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
          hasMore={campaigns.length === limit}
        />
      </>
      )}
    </div>
  );
}
