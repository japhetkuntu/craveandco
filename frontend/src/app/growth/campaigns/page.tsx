'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
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
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                placeholder="Campaign name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold"
                required
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold"
              >
                <option value="BIRTHDAY">Birthday</option>
                <option value="REACTIVATION">Win-Back</option>
                <option value="PROMOTION">Promotion</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <textarea
                placeholder="Campaign message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold resize-none"
                required
              />
              <Button type="submit" loading={submitting} className="w-full">Create Campaign</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {campaigns.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">No campaigns created yet</p>
      ) : (
        <>
          <div className="space-y-3">
            {campaigns.map((c) => (
              <Card key={c.id}>
              <CardContent className="p-4">
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
                  <span>Sent: {c.sentCount}</span>
                  <span>Opened: {c.openCount}</span>
                  <span>Redeemed: {c.redeemCount}</span>
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
          hasMore={campaigns.length === limit}
        />
      </>
      )}
    </div>
  );
}
