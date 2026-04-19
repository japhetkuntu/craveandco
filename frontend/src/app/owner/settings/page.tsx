'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch, del } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Settings, CreditCard, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

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
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="text-gold" /> Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">Configure payment types and other business settings.</p>
      </div>

      {error && <div className="rounded-2xl bg-error-muted p-4 text-sm text-error">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={16} /> Add Payment Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Display Name</span>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  placeholder="e.g. MTN MoMo, Cash, Visa"
                  className="mt-2 w-full rounded-2xl border border-border-default px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Payment Method</span>
                <select
                  value={newMethod}
                  onChange={e => setNewMethod(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>
              <Button type="submit" loading={saving} className="w-full">
                <Plus size={16} /> Add Payment Type
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Payment Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentTypes.map(pt => (
                <div
                  key={pt.id}
                  className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                    pt.active ? 'bg-surface-raised border-border-subtle' : 'bg-surface-base border-border-subtle opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className={pt.active ? 'text-gold' : 'text-text-tertiary'} />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{pt.name}</p>
                      <p className="text-xs text-text-tertiary">{PAYMENT_METHODS.find(m => m.value === pt.method)?.label || pt.method}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(pt)}
                      className="text-text-tertiary hover:text-gold p-1 transition-colors"
                    >
                      {pt.active ? <ToggleRight size={22} className="text-success" /> : <ToggleLeft size={22} />}
                    </button>
                    <button
                      onClick={() => handleDelete(pt.id)}
                      className="text-text-tertiary hover:text-error p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {paymentTypes.length === 0 && (
                <p className="text-sm text-text-tertiary text-center py-6">
                  No payment types yet. Add one so your team can close orders.
                </p>
              )}
            </div>
            <PaginationControls
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(value) => { setLimit(value); setPage(0); }}
              hasMore={paymentTypes.length === limit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
