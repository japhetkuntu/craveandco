'use client';

import { useState, useEffect, useCallback } from 'react';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { UserPlus, Target } from 'lucide-react';

const SOURCE_OPTIONS = [
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'WALK_IN_VISIT', label: 'Walk-in Visit' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EVENT', label: 'Event' },
  { value: 'EMAIL_OUTREACH', label: 'Email Outreach' },
  { value: 'OTHER', label: 'Other' },
];

interface AcquisitionLog {
  id: string;
  source: string;
  notes?: string;
  createdAt: string;
  customer?: { name: string; phone: string };
}

interface DailyTarget {
  individualTarget: number;
  businessTarget: number;
}

export default function SalesCustomersPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date] = useState(today);
  const [target, setTarget] = useState<DailyTarget | null>(null);
  const [logs, setLogs] = useState<AcquisitionLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('COLD_CALL');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [targetRes, logsRes] = await Promise.all([
        get<DailyTarget>(API_PATHS.sales.myTarget(date)),
        get<{ items: AcquisitionLog[]; total: number }>(API_PATHS.sales.acquisitions(date, page, limit)),
      ]);
      setTarget(targetRes);
      setLogs(logsRes.items);
      setTotal(logsRes.total);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [date, page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!name.trim() && !phone.trim()) {
      setError('Please enter a name or phone number.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await post(API_PATHS.sales.logAcquisition, {
        type: 'INDIVIDUAL',
        source,
        date,
        customerName: name.trim() || undefined,
        customerPhone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setName('');
      setPhone('');
      setNotes('');
      setSource('COLD_CALL');
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to log acquisition.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !target) return <PageSkeleton />;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Individual Acquisitions</h1>
          <p className="text-sm text-text-secondary mt-0.5">Log new customers you acquired today</p>
        </div>
        {target && (
          <div className="flex items-center gap-2 bg-info/10 text-info rounded-lg px-3 py-2 self-start">
            <Target size={14} />
            <span className="text-sm font-semibold">{total} / {target.individualTarget} today</span>
          </div>
        )}
      </div>

      {/* Log form */}
      <div className="bg-surface-raised border border-border-subtle rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <UserPlus size={16} className="text-info" />
          Log New Individual
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Customer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Acquisition Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-info"
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Log Acquisition'}
        </Button>
      </div>

      {/* Today's logs */}
      {logs.length > 0 ? (
        <div className="bg-surface-raised border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border-subtle">
            <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Acquisitions ({total})</h2>
          </div>
          <ul className="divide-y divide-border-subtle">
            {logs.map((log) => (
              <li key={log.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {log.customer?.name ?? '—'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {log.customer?.phone ?? ''}{' '}
                    {log.source && `· ${SOURCE_OPTIONS.find((s) => s.value === log.source)?.label ?? log.source}`}
                  </p>
                  {log.notes && <p className="text-xs text-text-secondary italic mt-0.5">{log.notes}</p>}
                </div>
                <span className="text-xs text-text-secondary">
                  {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 border-t border-border-subtle">
            <PaginationControls
              page={page}
              limit={limit}
              onPageChange={setPage}
              hasMore={page < totalPages}
            />
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12 text-text-secondary text-sm">
            No individual acquisitions logged today yet.
          </div>
        )
      )}
    </div>
  );
}
