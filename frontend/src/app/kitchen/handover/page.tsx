'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Send } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface HandoverNote {
  id: string;
  shift: string;
  content: string;
  createdAt: string;
  user: { name: string };
}

export default function KitchenHandoverPage() {
  const { token } = useAuth();
  const [notes, setNotes] = useState<HandoverNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [shift, setShift] = useState('MORNING');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const today = new Date().toISOString().split('T')[0];
    get(`/api/v1/kitchen/handover-notes${buildQueryString({ date: today, page, limit })}`, token)
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, page, limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !content.trim()) return;
    setSubmitting(true);
    try {
      const entry = await post('/api/v1/kitchen/handover-notes', {
        shift,
        content: content.trim(),
      }, token);
      setNotes((prev) => [entry, ...prev]);
      setShowForm(false);
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const shifts = ['MORNING', 'AFTERNOON', 'EVENING'];

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Clock className="text-gold" /> Shift Handover
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Note
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Shift</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold"
                >
                  {shifts.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="What does the next shift need to know?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                required
              />
              <Button type="submit" loading={submitting} className="w-full">
                <Send size={14} /> Post Handover Note
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">No handover notes yet</p>
      ) : (
        <>
          <div className="space-y-3">
            {notes.map((n) => (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gold-muted text-gold font-medium">
                      {n.shift}
                    </span>
                    <span className="text-xs text-text-tertiary">by {n.user?.name}</span>
                  </div>
                  <p className="text-sm text-text-primary">{n.content}</p>
                  <p className="text-xs text-text-tertiary mt-2">
                    {new Date(n.createdAt).toLocaleString('en-GH')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(0); }}
            hasMore={notes.length === limit}
          />
        </>
      )}
    </div>
  );
}
