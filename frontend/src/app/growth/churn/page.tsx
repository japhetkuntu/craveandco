'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Bell, UserX, ArrowUpDown, Send, CheckCircle2, Copy } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ChurnCustomer {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  lastVisitAt: string;
}

type SortKey = 'days' | 'visits' | 'spend';

export default function GrowthChurnPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<ChurnCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('days');
  const [launching, setLaunching] = useState<string | null>(null);
  const [launched, setLaunched] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    get('/api/v1/growth/churn-risk', token)
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const sorted = [...customers].sort((a, b) => {
    if (sortBy === 'days') return new Date(a.lastVisitAt).getTime() - new Date(b.lastVisitAt).getTime();
    if (sortBy === 'visits') return b.totalVisits - a.totalVisits;
    return b.totalSpent - a.totalSpent;
  });

  const handleReactivate = async (c: ChurnCustomer) => {
    if (!token) return;
    setLaunching(c.id);
    try {
      const campaign = await post('/api/v1/campaigns', {
        name: `Win Back: ${c.name}`,
        type: 'REACTIVATION',
        message: `Hi ${c.name}! We miss you at Crave & Co. It's been a while — come back and enjoy something delicious. We'd love to see you again! 🍽️`,
      }, token);
      await post(`/api/v1/campaigns/${campaign.id}/launch`, {}, token);
      setLaunched((prev) => new Set([...prev, c.id]));
    } catch (err) {
      console.error(err);
    } finally {
      setLaunching(null);
    }
  };

  const handleCopyPhone = (c: ChurnCustomer) => {
    navigator.clipboard.writeText(c.phone).catch(() => {});
    setCopied(c.id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="text-[var(--color-gold)]" /> Churn Risk
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} who haven&apos;t returned in over a week
          </p>
        </div>
        {/* Sort controls */}
        <div className="flex items-center gap-1 bg-surface-raised border border-border-subtle rounded-2xl p-1">
          <ArrowUpDown size={12} className="text-text-tertiary ml-2" />
          {([['days', 'Most urgent'], ['visits', 'Most visits'], ['spend', 'Top spend']] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sortBy === key ? 'bg-[var(--color-gold)] text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-border-default">
          <UserX size={48} className="mx-auto text-success mb-3" />
          <p className="font-semibold text-text-secondary">No churn risk detected!</p>
          <p className="text-sm text-text-tertiary mt-1">All regular customers are active</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => {
            const daysSince = Math.floor(
              (Date.now() - new Date(c.lastVisitAt).getTime()) / (1000 * 60 * 60 * 24),
            );
            const isLaunched = launched.has(c.id);
            const isLaunching = launching === c.id;
            const urgency = daysSince > 60 ? 'bg-error-muted border-error/30' : daysSince > 45 ? 'bg-warning-muted border-warning/30' : 'bg-surface-raised border-border-default';

            return (
              <div key={c.id} className={`rounded-3xl border overflow-hidden ${urgency}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary">{c.name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-text-secondary">
                        <span>{c.totalVisits} visits</span>
                        <span>Spent {formatCurrency(c.totalSpent)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xl font-bold ${daysSince > 45 ? 'text-error' : 'text-warning'}`}>{daysSince}d</span>
                      <p className="text-xs text-text-tertiary">since last visit</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-border-subtle/50">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyPhone(c)}
                      className="flex-1"
                    >
                      {copied === c.id ? <><CheckCircle2 size={13} /> Copied!</> : <><Copy size={13} /> {c.phone}</>}
                    </Button>
                    {isLaunched ? (
                      <div className="flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold text-success bg-success-muted border border-success/30">
                        <CheckCircle2 size={13} /> Campaign sent
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        loading={isLaunching}
                        onClick={() => handleReactivate(c)}
                        className="flex-1"
                      >
                        <Send size={13} /> Reactivate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
