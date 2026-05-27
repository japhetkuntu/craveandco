'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch, del } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Sparkles,
  Pencil,
} from 'lucide-react';

const RAFFLE_REWARD_OPTIONS = [
  { value: '', label: 'Not linked to raffle' },
  { value: 'FIFTY_PERCENT_FIRST_MEAL', label: '50% Off First Meal' },
  { value: 'TEN_PERCENT', label: '10% Off Order' },
  { value: 'FIVE_PERCENT', label: '5% Off Order' },
  { value: 'FREE_WATER', label: 'Free Water' },
  { value: 'FREE_DELIVERY', label: '12% Discount' },
] as const;

type RaffleRewardType = '' | 'FIFTY_PERCENT_FIRST_MEAL' | 'TEN_PERCENT' | 'FIVE_PERCENT' | 'FREE_WATER' | 'FREE_DELIVERY';

const RAFFLE_REWARD_LABELS: Record<string, string> = {
  FIFTY_PERCENT_FIRST_MEAL: '50% First Meal',
  TEN_PERCENT: '10% Off',
  FIVE_PERCENT: '5% Off',
  FREE_WATER: 'Free Water',
  FREE_DELIVERY: '12% Discount',
};

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
  menuScope: 'ALL' | 'SPECIFIC';
  menuItemIds: string[];
  discountScope: string;
  raffleRewardType?: string | null;
  createdAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  category?: { name: string };
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
  onEdit,
  busy,
}: {
  promo: Promotion;
  onActivate: (id: string) => void;
  onPause: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (promo: Promotion) => void;
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
        {promo.menuScope === 'SPECIFIC' && promo.menuItemIds?.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-md bg-[var(--color-gold)]/10 text-[var(--color-gold)] font-semibold">
            {promo.menuItemIds.length} item{promo.menuItemIds.length !== 1 ? 's' : ''}
          </span>
        )}
        {promo.menuScope === 'ALL' && (
          <span className="px-1.5 py-0.5 rounded-md bg-surface-input text-text-tertiary">All items</span>
        )}
        <span className={`px-1.5 py-0.5 rounded-md font-semibold ${
          promo.discountScope === 'FIRST_ITEM'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-surface-input text-text-tertiary'
        }`}>
          {promo.discountScope === 'FIRST_ITEM' ? '1st item only' : 'Entire order'}
        </span>
        {promo.raffleRewardType && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold">
            <Sparkles size={10} />
            {RAFFLE_REWARD_LABELS[promo.raffleRewardType] ?? promo.raffleRewardType}
          </span>
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
          <Button size="sm" variant="secondary" onClick={() => onEdit(promo)}>
            <Pencil size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerPromotionsPage() {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [itemSearch, setItemSearch] = useState('');

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
    menuScope: 'ALL' as 'ALL' | 'SPECIFIC',
    selectedMenuItemIds: [] as string[],
    discountScope: 'ALL_ITEMS' as 'ALL_ITEMS' | 'FIRST_ITEM',
    raffleRewardType: '' as RaffleRewardType,
  });

  const fetchData = async () => {
    if (!token) return;
    try {
      const promos = await get(API_PATHS.promotions.list, token);
      setPromotions(promos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    if (!token || menuItems.length > 0) return;
    setMenuItemsLoading(true);
    try {
      const items = await get(`${API_PATHS.menu.items}?limit=100`, token);
      setMenuItems(Array.isArray(items) ? items : (items?.items ?? []));
    } catch (err) {
      console.error('Failed to load menu items', err);
    } finally {
      setMenuItemsLoading(false);
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
        menuScope: form.menuScope,
        menuItemIds: form.menuScope === 'SPECIFIC' ? form.selectedMenuItemIds : [],
        discountScope: form.discountScope,
        raffleRewardType: form.raffleRewardType || undefined,
      }, token);
      setShowCreate(false);
      setForm({ name: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', startDate: '', endDate: '', menuScope: 'ALL', selectedMenuItemIds: [], discountScope: 'ALL_ITEMS', raffleRewardType: '' });
      setItemSearch('');
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

  const handleEdit = (promo: Promotion) => {
    const toDateInput = (d?: string) => d ? new Date(d).toISOString().split('T')[0] : '';
    setForm({
      name: promo.name,
      description: promo.description ?? '',
      type: promo.type,
      value: String(promo.value),
      minOrderAmount: promo.minOrderAmount ? String(promo.minOrderAmount) : '',
      maxDiscount: promo.maxDiscount ? String(promo.maxDiscount) : '',
      startDate: toDateInput(promo.startDate),
      endDate: toDateInput(promo.endDate),
      menuScope: promo.menuScope,
      selectedMenuItemIds: promo.menuItemIds ?? [],
      discountScope: (promo.discountScope as 'ALL_ITEMS' | 'FIRST_ITEM') ?? 'ALL_ITEMS',
      raffleRewardType: (promo.raffleRewardType ?? '') as RaffleRewardType,
    });
    setEditingPromo(promo);
    fetchMenuItems();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingPromo) return;
    setSaving(true);
    setError('');
    try {
      const updated = await patch(API_PATHS.promotions.update(editingPromo.id), {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        value: parseFloat(form.value),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        menuScope: form.menuScope,
        menuItemIds: form.menuScope === 'SPECIFIC' ? form.selectedMenuItemIds : [],
        discountScope: form.discountScope,
        raffleRewardType: form.raffleRewardType || undefined,
      }, token);
      setPromotions(prev => prev.map(p => p.id === editingPromo.id ? { ...p, ...updated } : p));
      setEditingPromo(null);
      setForm({ name: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', startDate: '', endDate: '', menuScope: 'ALL', selectedMenuItemIds: [], discountScope: 'ALL_ITEMS', raffleRewardType: '' });
      setItemSearch('');
    } catch (err: any) {
      setError(err.message || 'Failed to update promotion');
    } finally {
      setSaving(false);
    }
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
        <Button variant="primary" onClick={() => { setShowCreate(true); fetchMenuItems(); }}>
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
            <Button variant="primary" className="mt-4" onClick={() => { setShowCreate(true); fetchMenuItems(); }}>
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
              onEdit={handleEdit}
              busy={busy}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">New Promotion</h2>
                <p className="text-sm text-text-secondary mt-1">Set up a discount for your customers.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowCreate(false); setError(''); setItemSearch(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-error-muted text-error text-sm">
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
                  <label className="text-sm font-medium text-text-secondary">Discount Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'PERCENTAGE', label: 'Percentage off', icon: <Percent size={16} /> },
                      { value: 'FIXED_AMOUNT', label: 'Fixed amount off', icon: <DollarSign size={16} /> },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, type: opt.value }))}
                        className={`flex items-center gap-2 p-3 rounded-2xl border text-sm font-semibold transition-colors ${
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
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Start Date (optional)</span>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="mt-2 h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">End Date (optional)</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="mt-2 h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    />
                  </label>
                </div>

                {/* Menu Scope */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Applies To</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['ALL', 'SPECIFIC'] as const).map(scope => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, menuScope: scope, selectedMenuItemIds: [] }))}
                        className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-semibold transition-colors ${
                          form.menuScope === scope
                            ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-text-primary'
                            : 'border-border-subtle bg-surface-input text-text-secondary'
                        }`}
                      >
                        {scope === 'ALL' ? 'All menu items' : 'Specific items'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Item picker when SPECIFIC */}
                {form.menuScope === 'SPECIFIC' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-secondary">Select items</label>
                      {form.selectedMenuItemIds.length > 0 && (
                        <span className="text-xs text-[var(--color-gold)] font-semibold">
                          {form.selectedMenuItemIds.length} selected
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        type="text"
                        placeholder="Search menu items…"
                        value={itemSearch}
                        onChange={e => setItemSearch(e.target.value)}
                        className="h-10 w-full rounded-2xl border border-border-default bg-surface-input pl-8 pr-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-2xl border border-border-subtle divide-y divide-border-subtle">
                      {menuItemsLoading ? (
                        <div className="p-4 text-center text-sm text-text-tertiary">Loading items…</div>
                      ) : (() => {
                        const filteredItems = menuItems.filter(mi => mi.name.toLowerCase().includes(itemSearch.toLowerCase()));
                        if (filteredItems.length === 0) {
                          return <div className="p-4 text-center text-sm text-text-tertiary">No items found</div>;
                        }
                        return filteredItems.map(mi => {
                          const checked = form.selectedMenuItemIds.includes(mi.id);
                          return (
                            <label
                              key={mi.id}
                              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                checked ? 'bg-[var(--color-gold)]/8' : 'hover:bg-surface-raised'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setForm(prev => ({
                                    ...prev,
                                    selectedMenuItemIds: checked
                                      ? prev.selectedMenuItemIds.filter(id => id !== mi.id)
                                      : [...prev.selectedMenuItemIds, mi.id],
                                  }))
                                }
                                className="rounded border-border-default accent-[var(--color-gold)]"
                              />
                              <span className="text-sm text-text-primary flex-1 truncate">{mi.name}</span>
                              {mi.category?.name && (
                                <span className="text-xs text-text-tertiary shrink-0">{mi.category.name}</span>
                              )}
                            </label>
                          );
                        });
                      })()}
                    </div>
                    {form.selectedMenuItemIds.length === 0 && (
                      <p className="text-xs text-error">Select at least one item</p>
                    )}
                  </div>
                )}
              {/* Discount Scope */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Discount Applies To</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'ALL_ITEMS', label: 'Entire order' },
                      { value: 'FIRST_ITEM', label: 'First item only' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, discountScope: opt.value }))}
                        className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-semibold transition-colors ${
                          form.discountScope === opt.value
                            ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-text-primary'
                            : 'border-border-subtle bg-surface-input text-text-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {form.discountScope === 'FIRST_ITEM' && (
                    <p className="text-xs text-text-secondary">Discount applies to the highest-priced item in the order.</p>
                  )}
                </div>

                {/* Raffle Reward Link */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-500" />
                    Link to Raffle Reward (optional)
                  </label>
                  <select
                    value={form.raffleRewardType}
                    onChange={e => setForm(prev => ({ ...prev, raffleRewardType: e.target.value as RaffleRewardType }))}
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    {RAFFLE_REWARD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {form.raffleRewardType && (
                    <p className="text-xs text-purple-600 font-medium">
                      This promotion will auto-apply when a customer redeems a "{RAFFLE_REWARD_OPTIONS.find(o => o.value === form.raffleRewardType)?.label}" raffle reward.
                    </p>
                  )}
                </div>

              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowCreate(false); setError(''); setItemSearch(''); }}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" form="create-promo-form" type="submit" loading={saving}>
                Create Promotion
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPromo && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-2xl rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Edit Promotion</h2>
                <p className="text-sm text-text-secondary mt-1">{editingPromo.name}</p>
              </div>
              <Button variant="secondary" onClick={() => { setEditingPromo(null); setError(''); setItemSearch(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-error-muted text-error text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              <form id="edit-promo-form" onSubmit={handleUpdate} className="space-y-4">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Discount Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'PERCENTAGE', label: 'Percentage off', icon: <Percent size={16} /> },
                      { value: 'FIXED_AMOUNT', label: 'Fixed amount off', icon: <DollarSign size={16} /> },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, type: opt.value }))}
                        className={`flex items-center gap-2 p-3 rounded-2xl border text-sm font-semibold transition-colors ${
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
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">Start Date (optional)</span>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="mt-2 h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text-secondary">End Date (optional)</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="mt-2 h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Applies To</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['ALL', 'SPECIFIC'] as const).map(scope => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, menuScope: scope, selectedMenuItemIds: [] }))}
                        className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-semibold transition-colors ${
                          form.menuScope === scope
                            ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-text-primary'
                            : 'border-border-subtle bg-surface-input text-text-secondary'
                        }`}
                      >
                        {scope === 'ALL' ? 'All menu items' : 'Specific items'}
                      </button>
                    ))}
                  </div>
                </div>
                {form.menuScope === 'SPECIFIC' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-secondary">Select items</label>
                      {form.selectedMenuItemIds.length > 0 && (
                        <span className="text-xs text-[var(--color-gold)] font-semibold">
                          {form.selectedMenuItemIds.length} selected
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        type="text"
                        placeholder="Search menu items…"
                        value={itemSearch}
                        onChange={e => setItemSearch(e.target.value)}
                        className="h-10 w-full rounded-2xl border border-border-default bg-surface-input pl-8 pr-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-2xl border border-border-subtle divide-y divide-border-subtle">
                      {menuItemsLoading ? (
                        <div className="p-4 text-center text-sm text-text-tertiary">Loading items…</div>
                      ) : (() => {
                        const filteredItems = menuItems.filter(mi => mi.name.toLowerCase().includes(itemSearch.toLowerCase()));
                        if (filteredItems.length === 0) return <div className="p-4 text-center text-sm text-text-tertiary">No items found</div>;
                        return filteredItems.map(mi => {
                          const checked = form.selectedMenuItemIds.includes(mi.id);
                          return (
                            <label key={mi.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${ checked ? 'bg-[var(--color-gold)]/8' : 'hover:bg-surface-raised' }`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setForm(prev => ({
                                    ...prev,
                                    selectedMenuItemIds: checked
                                      ? prev.selectedMenuItemIds.filter(id => id !== mi.id)
                                      : [...prev.selectedMenuItemIds, mi.id],
                                  }))
                                }
                                className="rounded border-border-default accent-[var(--color-gold)]"
                              />
                              <span className="text-sm text-text-primary flex-1 truncate">{mi.name}</span>
                              {mi.category?.name && <span className="text-xs text-text-tertiary shrink-0">{mi.category.name}</span>}
                            </label>
                          );
                        });
                      })()}
                    </div>
                    {form.selectedMenuItemIds.length === 0 && <p className="text-xs text-error">Select at least one item</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Discount Applies To</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'ALL_ITEMS', label: 'Entire order' },
                      { value: 'FIRST_ITEM', label: 'First item only' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, discountScope: opt.value }))}
                        className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-semibold transition-colors ${
                          form.discountScope === opt.value
                            ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-text-primary'
                            : 'border-border-subtle bg-surface-input text-text-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {form.discountScope === 'FIRST_ITEM' && (
                    <p className="text-xs text-text-secondary">Discount applies to the highest-priced item in the order.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-500" />
                    Link to Raffle Reward (optional)
                  </label>
                  <select
                    value={form.raffleRewardType}
                    onChange={e => setForm(prev => ({ ...prev, raffleRewardType: e.target.value as RaffleRewardType }))}
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    {RAFFLE_REWARD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {form.raffleRewardType && (
                    <p className="text-xs text-purple-600 font-medium">
                      This promotion will auto-apply when a customer redeems a "{RAFFLE_REWARD_OPTIONS.find(o => o.value === form.raffleRewardType)?.label}" raffle reward.
                    </p>
                  )}
                </div>
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setEditingPromo(null); setError(''); setItemSearch(''); }}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" form="edit-promo-form" type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
