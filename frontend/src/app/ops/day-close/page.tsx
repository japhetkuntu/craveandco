'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, Receipt } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

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

interface CashBalance {
  openingFloat: number;
  cashSales: number;
  expectedCash: number;
  cashCounted: number;
  variance: number;
}

interface CloseResult extends DayCloseSummary {
  cashBalance?: CashBalance;
}

type Step = 1 | 2 | 3 | 'done';

export default function OpsDayClosePage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DayCloseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [openingFloat, setOpeningFloat] = useState('');
  const [cashCounted, setCashCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<CloseResult | null>(null);

  useEffect(() => {
    if (!token) return;
    const today = new Date().toISOString().split('T')[0];
    get(API_PATHS.ops.dayCloseSummary(today), token)
      .then((data) => {
        setSummary(data);
        if (data.closed) setStep('done');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const floatNum = parseFloat(openingFloat) || 0;
  const countedNum = parseFloat(cashCounted) || 0;

  const router = useRouter();

  const handleClose = async () => {
    if (!token) return;
    setClosing(true);
    try {
      const result = await post(API_PATHS.ops.dayClose, {
        openingFloat: floatNum,
        cashCounted: countedNum,
        notes: notes.trim() || undefined,
      }, token);
      setCloseResult(result);
      setStep('done');
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(false);
    }
  };

  const handleExpenses = () => {
    router.push('/ops/expenses');
  };

  const todayLabel = new Date().toLocaleDateString('en-GH', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  if (loading) return <PageSkeleton />;

  // ─── DONE ────────────────────────────────────────────────────────
  if (step === 'done') {
    const result = closeResult ?? summary;
    const cb = closeResult?.cashBalance;
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={28} className="text-success" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Day closed</h1>
            <p className="text-sm text-text-secondary">{todayLabel}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle"><p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Today&apos;s final summary</p></div>
          <div className="space-y-3">
            <SummaryRow label="Total sales" value={formatCurrency(result?.totalSales ?? 0)} large />
            <SummaryRow label="Orders completed" value={String(result?.orderCount ?? 0)} />
            <SummaryRow label="Expenses paid" value={formatCurrency(result?.totalExpenses ?? 0)} />

            {cb && (
              <>
                <hr className="border-border-default" />
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide pt-1">Cash balancing</p>
                <SummaryRow label="Opening float" value={formatCurrency(cb.openingFloat)} />
                <SummaryRow label="Cash sales (system)" value={formatCurrency(cb.cashSales)} />
                <SummaryRow label="Expected in till" value={formatCurrency(cb.expectedCash)} large />
                <SummaryRow label="You counted" value={formatCurrency(cb.cashCounted)} large />
                <div className={`rounded-xl p-4 ${cb.variance >= 0 ? 'bg-success-muted' : 'bg-warning-muted'}`}>
                  <p className={`text-sm font-bold ${cb.variance >= 0 ? 'text-success' : 'text-warning'}`}>
                    {cb.variance === 0
                      ? '✓ Cash balanced perfectly'
                      : cb.variance > 0
                      ? `▲ Over by ${formatCurrency(Math.abs(cb.variance))}`
                      : `▼ Short by ${formatCurrency(Math.abs(cb.variance))}`}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 1: Today's numbers ──────────────────────────────────────
  if (step === 1) {
    const net = (summary?.totalSales ?? 0) - (summary?.totalExpenses ?? 0);
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">End of day</h1>
          <p className="text-sm text-text-secondary mt-1">{todayLabel}</p>
        </div>

        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle"><p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Today&apos;s numbers</p></div>
          <div className="space-y-3">
            <SummaryRow label="Total sales" value={formatCurrency(summary?.totalSales ?? 0)} large />
            <SummaryRow label="Orders completed" value={String(summary?.orderCount ?? 0)} />
            <SummaryRow label="Expenses paid" value={formatCurrency(summary?.totalExpenses ?? 0)} />
            <hr className="border-border-default" />
            <SummaryRow
              label="Net (sales minus expenses)"
              value={formatCurrency(net)}
              large
              highlight={net >= 0 ? 'green' : 'red'}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border-subtle bg-surface-default p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-text-primary">Need to record an extra expense?</p>
                <p className="text-xs text-text-secondary mt-1">Capture soap, utilities, waste disposal, or other branch costs before closing.</p>
              </div>
              <Button variant="secondary" onClick={handleExpenses}>
                <Receipt size={16} />
                Record Expense
              </Button>
            </div>
          </div>
          <Button onClick={() => setStep(2)} className="w-full">
            Next: Count the cash →
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Count the cash ───────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Count the cash</h1>
          <p className="text-sm text-text-secondary mt-1">
            Take out all the cash from the till and count it carefully before entering the amounts below.
          </p>
        </div>

        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="space-y-6 pt-5">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Opening float
              </label>
              <p className="text-xs text-text-secondary mb-2">
                How much cash was put in the till at the start of today? (Leave as 0 if you don&apos;t use a float.)
              </p>
              <Input
                type="number"
                placeholder="0.00"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Cash in the till right now
              </label>
              <p className="text-xs text-text-secondary mb-2">
                Count every note and coin and enter the total amount here.
              </p>
              <Input
                type="number"
                placeholder="0.00"
                value={cashCounted}
                onChange={(e) => setCashCounted(e.target.value)}
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
          <Button
            onClick={() => setStep(3)}
            disabled={!cashCounted || parseFloat(cashCounted) < 0}
            className="flex-1"
          >
            Next: Review balance →
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP 3: Review & confirm ─────────────────────────────────────
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Review &amp; close</h1>
        <p className="text-sm text-text-secondary mt-1">
          Check everything looks right before closing the day.
        </p>
      </div>

      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle"><p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Cash balancing</p></div>
        <div className="space-y-3">
          <SummaryRow label="Opening float" value={formatCurrency(floatNum)} />
          <SummaryRow label="Total sales today (system)" value={formatCurrency(summary?.totalSales ?? 0)} />
          <SummaryRow label="Cash you counted" value={formatCurrency(countedNum)} large />
          <div className="rounded-xl bg-surface-default border border-border-default p-3">
            <p className="text-xs text-text-secondary">
              The exact cash-vs-card split will be calculated when you close. The final balance report will show your variance against cash-only sales.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1">
          Notes <span className="font-normal text-text-secondary">(optional)</span>
        </label>
        <textarea
          className="w-full rounded-xl border border-border-default bg-surface-default p-3 text-base text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-gold"
          rows={3}
          placeholder="Any notes for the record (e.g. explanation for a cash discrepancy)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-warning bg-warning-muted p-4">
        <p className="text-sm font-semibold text-warning">This will lock today&apos;s records.</p>
        <p className="text-xs text-text-secondary mt-1">Make sure all orders are done and stock counts are complete before closing.</p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
        <Button variant="danger" onClick={handleClose} loading={closing} className="flex-1">
          Close today →
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  large,
  highlight,
}: {
  label: string;
  value: string;
  large?: boolean;
  highlight?: 'green' | 'red';
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={[
          large ? 'text-lg font-bold' : 'text-sm font-medium',
          highlight === 'green' ? 'text-success' : highlight === 'red' ? 'text-danger' : 'text-text-primary',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
