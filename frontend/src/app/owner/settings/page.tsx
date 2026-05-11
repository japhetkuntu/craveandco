'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch, del } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, CreditCard, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface PaymentType {
  id: string;
  name: string;
  method: string;
  active: boolean;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export default function OwnerSettingsPage() {
  const { token } = useAuth();
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [newName, setNewName] = useState('');
  const [newMethod, setNewMethod] = useState('CASH');

  const fetchData = async () => {
    if (!token) return;
    try {
      const types = await get(`/api/v1/owner/payment-types${buildQueryString({ page, limit })}`, token);
      setPaymentTypes(types);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token, page, limit]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await post('/api/v1/owner/payment-types', {
        name: newName.trim(),
        method: newMethod,
      }, token);
      setNewName('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pt: PaymentType) => {
    if (!token) return;
    try {
      await patch(`/api/v1/owner/payment-types/${pt.id}`, { active: !pt.active }, token);
      setPaymentTypes(prev => prev.map(p => p.id === pt.id ? { ...p, active: !p.active } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await del(`/api/v1/owner/payment-types/${id}`, token);
      setPaymentTypes(prev => prev.filter(p => p.id !== id));
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
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="text-[var(--color-gold)]" /> Settings
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">Configure payment types and other business settings.</p>
      </div>

      {error && <div className="rounded-2xl bg-error-muted p-4 text-sm text-error">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add payment type */}
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
            <CreditCard size={14} className="text-[var(--color-gold)]" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Add Payment Type</p>
          </div>
          <div className="p-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Display Name"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                placeholder="e.g. MTN MoMo, Cash, Visa"
              />
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Payment Method</label>
                <select
                  value={newMethod}
                  onChange={e => setNewMethod(e.target.value)}
                  className="w-full rounded-2xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" loading={saving} className="w-full">
                <Plus size={16} /> Add Payment Type
              </Button>
            </form>
          </div>
        </div>

        {/* Payment types list */}
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Active Payment Types</p>
          </div>
          <div className="divide-y divide-border-subtle">
            {paymentTypes.map(pt => (
              <div
                key={pt.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 transition-opacity ${!pt.active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={16} className={pt.active ? 'text-[var(--color-gold)]' : 'text-text-tertiary'} />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{pt.name}</p>
                    <p className="text-xs text-text-tertiary">{PAYMENT_METHODS.find(m => m.value === pt.method)?.label || pt.method}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(pt)} className="p-1 text-text-tertiary hover:text-[var(--color-gold)] transition-colors">
                    {pt.active ? <ToggleRight size={22} className="text-success" /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => handleDelete(pt.id)} className="p-1 text-text-tertiary hover:text-error transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {paymentTypes.length === 0 && (
              <p className="text-sm text-text-tertiary text-center py-10">No payment types yet. Add one so your team can close orders.</p>
            )}
          </div>
          <div className="px-4 pb-4 pt-2">
            <PaginationControls
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(value) => { setLimit(value); setPage(0); }}
              hasMore={paymentTypes.length === limit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
