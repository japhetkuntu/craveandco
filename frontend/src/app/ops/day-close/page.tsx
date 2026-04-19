'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/utils';
import { Clock, ShoppingCart, Receipt, DollarSign, Lock } from 'lucide-react';

interface DayCloseSummary {
  date: string;
  totalSales: number;
  orderCount: number;
  totalExpenses: number;
  closed?: boolean;
  closedAt?: string | null;
  closedBy?: string | null;
  auditId?: string | null;
}

export default function OpsDayClosePage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DayCloseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!token) return;
    const today = new Date().toISOString().split('T')[0];
    get(API_PATHS.ops.dayCloseSummary(today), token)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closed, setClosed] = useState(false);
  const [closeResult, setCloseResult] = useState<DayCloseSummary | null>(null);

  const handleClose = async () => {
    if (!token) return;
    setClosing(true);
    try {
      const result = await post(API_PATHS.ops.dayClose, {}, token);
      setClosed(true);
      setCloseResult(result);
      setConfirmOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(false);
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
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <Clock className="text-gold" /> Day Close
      </h1>
      <p className="text-sm text-text-secondary">
        {new Date().toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Sales" value={formatCurrency(summary?.totalSales || 0)} icon={<DollarSign size={20} />} severity="healthy" />
        <KPICard title="Orders" value={summary?.orderCount || 0} icon={<ShoppingCart size={20} />} />
        <KPICard title="Expenses" value={formatCurrency(summary?.totalExpenses || 0)} icon={<Receipt size={20} />} severity="warning" />
        <KPICard
          title="Net"
          value={formatCurrency((summary?.totalSales || 0) - (summary?.totalExpenses || 0))}
          icon={<DollarSign size={20} />}
          severity={((summary?.totalSales || 0) - (summary?.totalExpenses || 0)) >= 0 ? 'healthy' : 'critical'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Close Today's Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            Closing the day will finalize all records for today. Ensure all orders are completed, 
            cash is reconciled, and handover notes are posted before proceeding.
          </p>
          <div className="flex items-center gap-3 p-4 bg-gold-muted rounded-xl">
            <Lock size={20} className="text-gold" />
            <p className="text-sm text-warning">This action cannot be undone for today's date.</p>
          </div>
          <Button variant="danger" onClick={() => setConfirmOpen(true)} className="w-full">
            <Lock size={16} /> Close Day
          </Button>
        </CardContent>
      </Card>

      {closed && closeResult && (
        <Card className="border-success bg-success-muted">
          <CardHeader>
            <CardTitle>Day Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-success">Day close completed successfully.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-xs text-text-secondary">Sales</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">{formatCurrency(closeResult.totalSales)}</p>
              </div>
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-xs text-text-secondary">Orders</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">{closeResult.orderCount}</p>
              </div>
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-xs text-text-secondary">Expenses</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">{formatCurrency(closeResult.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Day Close" size="md" footer={
        <>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleClose} loading={closing}>Close Day</Button>
        </>
      }>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will lock today&apos;s operational data and record a day-close event.
            Please make sure all food counts, cash reconciliation, and handover notes are complete.
          </p>
          <div className="rounded-3xl bg-surface-default p-4 border border-border-default">
            <p className="text-sm font-semibold text-text-primary">Today&apos;s summary</p>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-text-secondary">
              <div className="flex justify-between">
                <span>Total sales</span>
                <strong>{formatCurrency(summary?.totalSales || 0)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Order count</span>
                <strong>{summary?.orderCount || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total expenses</span>
                <strong>{formatCurrency(summary?.totalExpenses || 0)}</strong>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
