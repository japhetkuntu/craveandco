'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { Check, CheckCircle2, Receipt, TrendingUp, ShoppingBag, AlertTriangle, Lock } from 'lucide-react';
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

function StepBar({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { num: 1 as const, label: "Today's recap" },
    { num: 2 as const, label: 'Count cash' },
    { num: 3 as const, label: 'Confirm & close' },
  ];
  return (
    <div className="flex items-start">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-start flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s.num < current ? 'bg-success text-white' :
              s.num === current ? 'bg-[var(--color-gold)] text-white shadow-md' :
              'bg-surface-elevated text-text-tertiary border-2 border-border-default'
            }`}>
              {s.num < current ? <Check size={14} /> : s.num}
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight max-w-[64px] ${s.num === current ? 'text-text-primary' : 'text-text-tertiary'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mt-4 mx-1 rounded-full transition-all ${s.num < current ? 'bg-success' : 'bg-border-default'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

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
  const router = useRouter();

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

  const todayLabel = new Date().toLocaleDateString('en-GH', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  if (loading) return <PageSkeleton />;

  const net = (summary?.totalSales ?? 0) - (summary?.totalExpenses ?? 0);

  // ─── DONE ──────────────────────────────────────────────────────
  if (step === 'done') {
    const result = closeResult ?? summary;
    const cb = closeResult?.cashBalance;
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="rounded-3xl bg-success-muted border border-success/30 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-success flex items-center justify-center shrink-0">
            <CheckCircle2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-success">Day successfully closed!</h1>
            <p className="text-sm text-text-secondary mt-0.5">{todayLabel}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Final Summary</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface-elevated p-4">
                <p className="text-xs text-text-tertiary mb-1">Total Sales</p>
                <p className="text-xl font-bold text-text-primary">{formatCurrency(result?.totalSales ?? 0)}</p>
              </div>
              <div className="rounded-2xl bg-surface-elevated p-4">
                <p className="text-xs text-text-tertiary mb-1">Orders Done</p>
                <p className="text-xl font-bold text-text-primary">{result?.orderCount ?? 0}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-surface-elevated p-4 flex justify-between items-center">
              <span className="text-sm text-text-secondary">Expenses paid</span>
              <span className="text-sm font-semibold text-text-primary">{formatCurrency(result?.totalExpenses ?? 0)}</span>
            </div>
            {cb && (
              <div className="border-t border-border-subtle pt-3 space-y-2">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide pb-1">Cash Balancing</p>
                <div className="flex justify-between text-sm"><span className="text-text-secondary">Opening float</span><span className="font-medium text-text-primary">{formatCurrency(cb.openingFloat)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-secondary">Cash sales (system)</span><span className="font-medium text-text-primary">{formatCurrency(cb.cashSales)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-secondary">Expected in till</span><span className="font-semibold text-text-primary">{formatCurrency(cb.expectedCash)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-secondary">You counted</span><span className="font-semibold text-text-primary">{formatCurrency(cb.cashCounted)}</span></div>
                <div className={`rounded-2xl p-4 flex items-center gap-3 mt-1 ${cb.variance === 0 ? 'bg-success-muted' : Math.abs(cb.variance) < 5 ? 'bg-warning-muted' : 'bg-error-muted'}`}>
                  <span className={`text-2xl font-bold leading-none ${cb.variance === 0 ? 'text-success' : Math.abs(cb.variance) < 5 ? 'text-warning' : 'text-error'}`}>
                    {cb.variance === 0 ? '✓' : cb.variance > 0 ? '▲' : '▼'}
                  </span>
                  <div>
                    <p className={`text-sm font-bold ${cb.variance === 0 ? 'text-success' : Math.abs(cb.variance) < 5 ? 'text-warning' : 'text-error'}`}>
                      {cb.variance === 0 ? 'Cash balanced perfectly' : cb.variance > 0 ? `Over by ${formatCurrency(Math.abs(cb.variance))}` : `Short by ${formatCurrency(Math.abs(cb.variance))}`}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">Variance from expected amount</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 1: Today's Recap ─────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Close the Day</h1>
          <p className="text-sm text-text-secondary mt-1">{todayLabel}</p>
        </div>

        <StepBar current={1} />

        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Today&apos;s Recap</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface-elevated p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={13} className="text-text-tertiary" />
                  <span className="text-xs text-text-tertiary font-medium">Total Sales</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(summary?.totalSales ?? 0)}</p>
              </div>
              <div className="rounded-2xl bg-surface-elevated p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShoppingBag size={13} className="text-text-tertiary" />
                  <span className="text-xs text-text-tertiary font-medium">Orders Done</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{summary?.orderCount ?? 0}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-surface-elevated p-4 flex justify-between items-center">
              <span className="text-sm text-text-secondary">Expenses paid today</span>
              <span className="text-sm font-semibold text-text-primary">{formatCurrency(summary?.totalExpenses ?? 0)}</span>
            </div>
            <div className={`rounded-2xl p-4 flex justify-between items-center ${net >= 0 ? 'bg-success-muted border border-success/20' : 'bg-error-muted border border-error/20'}`}>
              <span className="text-sm font-semibold text-text-primary">Net profit today</span>
              <span className={`text-xl font-bold ${net >= 0 ? 'text-success' : 'text-error'}`}>{formatCurrency(net)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-default p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">Need to log an expense?</p>
            <p className="text-xs text-text-secondary mt-0.5">Record any extra costs before closing the day.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.push('/ops/expenses')}>
            <Receipt size={14} /> Record
          </Button>
        </div>

        <Button onClick={() => setStep(2)} className="w-full">
          Next: Count the cash →
        </Button>
      </div>
    );
  }

  // ─── STEP 2: Count the Cash ────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Count the Cash</h1>
          <p className="text-sm text-text-secondary mt-1">Take all the cash out of the till and count it carefully.</p>
        </div>

        <StepBar current={2} />

        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Cash Count</p>
          </div>
          <div className="p-5 space-y-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">Opening float</label>
              <p className="text-xs text-text-secondary">The cash put in the till at the start of today. Enter 0 if you don&apos;t use a float.</p>
              <Input
                type="number"
                placeholder="0.00"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">Cash in the till right now</label>
              <p className="text-xs text-text-secondary">Count every note and coin, then enter the total here.</p>
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
            Next: Review →
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP 3: Confirm & Close ───────────────────────────────────
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Confirm &amp; Close</h1>
        <p className="text-sm text-text-secondary mt-1">Review everything below before locking today&apos;s records.</p>
      </div>

      <StepBar current={3} />

      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Today&apos;s Totals</p>
        </div>
        <div className="p-5 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Total sales</span>
            <span className="text-sm font-semibold text-text-primary">{formatCurrency(summary?.totalSales ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Orders completed</span>
            <span className="text-sm font-semibold text-text-primary">{summary?.orderCount ?? 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Expenses paid</span>
            <span className="text-sm font-semibold text-text-primary">{formatCurrency(summary?.totalExpenses ?? 0)}</span>
          </div>
          <div className="border-t border-border-subtle pt-2.5 flex justify-between items-center">
            <span className="text-sm font-semibold text-text-primary">Net profit</span>
            <span className={`text-base font-bold ${net >= 0 ? 'text-success' : 'text-error'}`}>{formatCurrency(net)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Cash Count</p>
        </div>
        <div className="p-5 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Opening float</span>
            <span className="text-sm font-semibold text-text-primary">{formatCurrency(floatNum)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Cash you counted</span>
            <span className="text-sm font-semibold text-text-primary">{formatCurrency(countedNum)}</span>
          </div>
          <div className="rounded-2xl bg-surface-elevated border border-border-subtle p-3 mt-1">
            <p className="text-xs text-text-secondary">The exact cash variance will be calculated against cash-only sales when you close.</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-text-primary">
          Notes <span className="font-normal text-text-tertiary">(optional)</span>
        </label>
        <textarea
          className="w-full rounded-2xl border border-border-default bg-surface-default p-4 text-sm text-text-primary resize-none focus:outline-none focus:border-[var(--color-gold)]"
          rows={3}
          placeholder="Any notes for the record (e.g. reason for a cash discrepancy)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-warning/40 bg-warning-muted p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warning">This will lock today&apos;s records.</p>
          <p className="text-xs text-text-secondary mt-0.5">Make sure all orders are completed and all expenses are recorded before closing.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
        <Button variant="danger" onClick={handleClose} loading={closing} className="flex-1">
          <Lock size={16} /> Close Day
        </Button>
      </div>
    </div>
  );
}
