'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch, del } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { API_PATHS } from '@/lib/constants';
import {
  Tag,
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  Percent,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  usageCount: number;
  totalDiscount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'cancelled',
};

function PromotionCard({
  promo,
  onActivate,
  onPause,
  onDeactivate,
  onDelete,
  busy,
}: {
  promo: Promotion;
  onActivate: (id: string) => void;
  onPause: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
  busy: string | null;
}) {
  const isBusy = busy === promo.id;
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary truncate">{promo.name}</span>
            <StatusBadge status={STATUS_LABELS[promo.status] || 'draft'} />
          </div>
          {promo.description && (
            <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{promo.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {promo.type === 'PERCENTAGE' ? (
            <Percent size={14} className="text-[var(--color-gold)]" />
          ) : (
            <DollarSign size={14} className="text-[var(--color-gold)]" />
          )}
          <span className="text-base font-bold text-text-primary font-mono">
            {promo.type === 'PERCENTAGE' ? `${promo.value}%` : formatCurrency(promo.value)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
        {promo.minOrderAmount && (
          <span>Min order: {formatCurrency(promo.minOrderAmount)}</span>
        )}
        {promo.maxDiscount && (
          <span>Max off: {formatCurrency(promo.maxDiscount)}</span>
        )}
        {promo.startDate && (
          <span>From: {new Date(promo.startDate).toLocaleDateString()}</span>
        )}
        {promo.endDate && (
          <span>Until: {new Date(promo.endDate).toLocaleDateString()}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs pt-1 border-t border-border-subtle">
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary font-mono">{promo.usageCount}</span> uses
        </span>
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary font-mono">{formatCurrency(promo.totalDiscount)}</span> given
        </span>
        <div className="ml-auto flex gap-1.5">
          {promo.status === 'DRAFT' || promo.status === 'PAUSED' ? (
            <Button size="sm" variant="primary" loading={isBusy} onClick={() => onActivate(promo.id)}>
              <Play size={13} className="mr-1" /> Activate
            </Button>
          ) : promo.status === 'ACTIVE' ? (
            <Button size="sm" variant="secondary" loading={isBusy} onClick={() => onPause(promo.id)}>
              <Pause size={13} className="mr-1" /> Pause
            </Button>
          ) : null}
          {promo.status === 'ACTIVE' || promo.status === 'PAUSED' ? (
            <Button size="sm" variant="danger-ghost" loading={isBusy} onClick={() => onDeactivate(promo.id)}>
              <Square size={13} className="mr-1" /> Draft
            </Button>
          ) : null}
          {promo.usageCount === 0 && (
            <Button size="sm" variant="danger-ghost" loading={isBusy} onClick={() => onDelete(promo.id)}>
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OwnerPromotionsPage() {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
  });

  const fetchData = async () => {
    if (!token) return;
    try {
      const data = await get(API_PATHS.promotions.list, token);
      setPromotions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      await post(API_PATHS.promotions.create, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        value: parseFloat(form.value),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }, token);
      setShowCreate(false);
      setForm({ name: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', startDate: '', endDate: '' });
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (!token) return;
    setBusy(id);
    try {
      await patch(API_PATHS.promotions.activate(id), {}, token);
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: 'ACTIVE' } : p));
    } catch (err) { console.error(err); }
    finally { setBusy(null); }
  };

  const handlePause = async (id: string) => {
    if (!token) return;
    setBusy(id);
    try {
      await patch(API_PATHS.promotions.pause(id), {}, token);
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: 'PAUSED' } : p));
    } catch (err) { console.error(err); }
    finally { setBusy(null); }
  };

  const handleDeactivate = async (id: string) => {
    if (!token) return;
    setBusy(id);
    try {
      await patch(API_PATHS.promotions.deactivate(id), {}, token);
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: 'DRAFT' } : p));
    } catch (err) { console.error(err); }
    finally { setBusy(null); }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setBusy(id);
    try {
      await del(API_PATHS.promotions.delete(id), token);
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
    finally { setBusy(null); }
  };

  const filtered = filterStatus === 'ALL'
    ? promotions
    : promotions.filter(p => p.status === filterStatus);

  const statusCounts = {
    ALL: promotions.length,
    ACTIVE: promotions.filter(p => p.status === 'ACTIVE').length,
    DRAFT: promotions.filter(p => p.status === 'DRAFT').length,
    PAUSED: promotions.filter(p => p.status === 'PAUSED').length,
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Tag size={22} className="text-[var(--color-gold)]" />
            Promotions
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Create and manage discount promotions
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1.5" /> New Promotion
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {(['ALL', 'ACTIVE', 'DRAFT', 'PAUSED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filterStatus === s
                ? 'bg-[var(--color-gold)] text-black'
                : 'bg-surface-raised text-text-secondary border border-border-subtle'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            <span className="ml-1.5 text-xs opacity-70">({statusCounts[s]})</span>
          </button>
        ))}
      </div>

      {/* Stats Row */}
      {promotions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: promotions.length, tone: 'default' as const },
            { label: 'Active', value: statusCounts.ACTIVE, tone: statusCounts.ACTIVE > 0 ? 'green' as const : 'default' as const },
            {
              label: 'Total Uses',
              value: promotions.reduce((s, p) => s + p.usageCount, 0),
              tone: 'default' as const,
            },
            {
              label: 'Discount Given',
              value: formatCurrency(promotions.reduce((s, p) => s + p.totalDiscount, 0)),
              tone: 'default' as const,
            },
          ].map(({ label, value, tone }) => {
            const bg = tone === 'green' ? 'bg-success-muted border-success/30' : 'bg-surface-raised border-border-subtle';
            const tv = tone === 'green' ? 'text-success' : 'text-text-primary';
            return (
              <div key={label} className={`rounded-2xl border p-4 flex flex-col gap-1 ${bg}`}>
                <span className="text-[0.6875rem] font-semibold text-text-secondary uppercase tracking-widest">{label}</span>
                <span className={`text-2xl font-bold font-mono ${tv}`}>{value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Promotions List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-10 text-center">
          <Tag size={32} className="mx-auto mb-3 text-text-tertiary" />
          <p className="font-semibold text-text-primary">No promotions yet</p>
          <p className="text-sm text-text-secondary mt-1">
            {filterStatus === 'ALL'
              ? 'Create your first promotion to start driving sales.'
              : `No ${filterStatus.toLowerCase()} promotions.`}
          </p>
          {filterStatus === 'ALL' && (
            <Button variant="primary" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} className="mr-1.5" /> New Promotion
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(promo => (
            <PromotionCard
              key={promo.id}
              promo={promo}
              onActivate={handleActivate}
              onPause={handlePause}
              onDeactivate={handleDeactivate}
              onDelete={handleDelete}
              busy={busy}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setError(''); }}
        title="New Promotion"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowCreate(false); setError(''); }}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" form="create-promo-form" type="submit" loading={saving}>
              Create Promotion
            </Button>
          </div>
        }
      >
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error-muted text-error text-sm mb-4">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <form id="create-promo-form" onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Promotion Name"
            placeholder="e.g. Weekend Special, Happy Hour"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="What this promotion is about"
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          />

          {/* Discount Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">Discount Type</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'PERCENTAGE', label: 'Percentage off', icon: <Percent size={16} /> },
                { value: 'FIXED_AMOUNT', label: 'Fixed amount off', icon: <DollarSign size={16} /> },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: opt.value }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-colors ${
                    form.type === opt.value
                      ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-text-primary'
                      : 'border-border-subtle bg-surface-input text-text-secondary'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={form.type === 'PERCENTAGE' ? 'Discount %' : 'Discount Amount'}
              placeholder={form.type === 'PERCENTAGE' ? '10' : '5.00'}
              type="number"
              min="0"
              max={form.type === 'PERCENTAGE' ? '100' : undefined}
              step="0.01"
              value={form.value}
              onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
              required
            />
            {form.type === 'PERCENTAGE' && (
              <Input
                label="Max Discount Cap (optional)"
                placeholder="e.g. 20.00"
                type="number"
                min="0"
                step="0.01"
                value={form.maxDiscount}
                onChange={e => setForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
              />
            )}
            {form.type === 'FIXED_AMOUNT' && (
              <Input
                label="Min Order Amount (optional)"
                placeholder="e.g. 30.00"
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={e => setForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
              />
            )}
          </div>

          {form.type === 'PERCENTAGE' && (
            <Input
              label="Min Order Amount (optional)"
              placeholder="e.g. 30.00"
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={e => setForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-secondary">Start Date (optional)</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                className="h-12 w-full rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-secondary">End Date (optional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="h-12 w-full rounded-xl border border-border-default bg-surface-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
