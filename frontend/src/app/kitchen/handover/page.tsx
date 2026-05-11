'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Clock, Send, MessageSquarePlus } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

interface HandoverNote {
  id: string;
  shift: string;
  content: string;
  createdAt: string;
  user: { name: string };
}

const SHIFTS = [
  { value: 'MORNING', label: '🌅 Morning' },
  { value: 'AFTERNOON', label: '☀️ Afternoon' },
  { value: 'EVENING', label: '🌙 Evening' },
];

const SHIFT_COLORS: Record<string, string> = {
  MORNING: 'bg-amber-50 border-amber-200 text-amber-700',
  AFTERNOON: 'bg-blue-50 border-blue-200 text-blue-700',
  EVENING: 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

export default function KitchenHandoverPage() {
  const { token } = useAuth();
  const [notes, setNotes] = useState<HandoverNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [shift, setShift] = useState('MORNING');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const [viewDate, setViewDate] = useState(todayStr);
  const isToday = viewDate === todayStr;

  const goDay = (delta: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().split('T')[0];
    if (next <= todayStr) setViewDate(next);
  };

  const viewLabel = isToday
    ? 'Today'
    : new Date(viewDate + 'T12:00:00').toLocaleDateString('en-GH', { weekday: 'long', month: 'short', day: 'numeric' });

  const fetchNotes = async () => {
    if (!token) return;
    try {
      const data = await get(
        `/api/v1/kitchen/handover-notes${buildQueryString({ date: viewDate, page, limit })}`,
        token,
      );
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [token, viewDate, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !content.trim()) return;
    setSubmitting(true);
    try {
      const entry = await post('/api/v1/kitchen/handover-notes', { shift, content: content.trim() }, token);
      setNotes((prev) => [entry, ...prev]);
      setContent('');
      toast('success', 'Note posted', 'Your handover note has been saved.');
    } catch (err) {
      toast('error', 'Could not post note', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Clock className="text-[var(--color-gold)]" size={22} /> Shift Handover
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Leave notes for the next shift</p>
        </div>
        {/* Date navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goDay(-1)}
            className="p-2 rounded-xl border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            aria-label="Previous day"
          >&#8249;</button>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            isToday ? 'bg-[var(--color-gold)] text-white border-[var(--color-gold)]' : 'bg-surface-raised text-text-secondary border-border-subtle'
          }`}>{viewLabel}</span>
          <button
            onClick={() => goDay(1)}
            disabled={isToday}
            className="p-2 rounded-xl border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-30"
            aria-label="Next day"
          >&#8250;</button>
        </div>
      </div>

      {/* Write a note — always visible */}
      <div className="rounded-3xl border border-[var(--color-gold)]/30 bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
          <MessageSquarePlus size={16} className="text-[var(--color-gold)]" />
          <p className="text-sm font-bold text-text-primary">Leave a note for the next shift</p>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Shift picker */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Which shift is this for?</p>
            <div className="grid grid-cols-3 gap-2">
              {SHIFTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setShift(s.value)}
                  className={`py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
                    shift === s.value
                      ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-white'
                      : 'border-border-subtle bg-surface-base text-text-secondary hover:border-[var(--color-gold)]/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note text */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Your note</p>
            <textarea
              placeholder="E.g. — Fridge door needs checking, we ran out of chilli sauce, sauce made fresh at 2pm…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              className="w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)] resize-none leading-relaxed"
            />
          </div>

          <Button type="submit" loading={submitting} className="w-full h-12 text-base">
            <Send size={16} /> Post Note
          </Button>
        </form>
      </div>

      {/* Notes list */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary mb-3">
          {viewLabel}&apos;s Notes ({notes.length})
        </p>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center rounded-3xl border border-dashed border-border-default">
            <Clock size={36} className="text-text-tertiary opacity-40" />
            <p className="text-sm text-text-secondary font-medium">No notes posted today yet</p>
            <p className="text-xs text-text-tertiary">Be the first to leave a handover note</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="rounded-3xl border border-border-default bg-surface-raised p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${SHIFT_COLORS[n.shift] ?? 'bg-surface-elevated text-text-secondary border-border-subtle'}`}>
                    {SHIFTS.find((s) => s.value === n.shift)?.label ?? n.shift}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {new Date(n.createdAt).toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-text-primary leading-relaxed">{n.content}</p>
                <p className="text-xs text-text-tertiary">— {n.user?.name}</p>
              </div>
            ))}
            <PaginationControls
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={() => {}}
              hasMore={notes.length === limit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
