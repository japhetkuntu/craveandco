'use client';

import { useState, useEffect, useCallback } from 'react';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CalendarDays, ChevronRight, ClipboardList, Flag, Plus, Target } from 'lucide-react';
import Link from 'next/link';

type PlanStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
type PlanType = 'INDIVIDUAL' | 'BUSINESS';
type PlanPriority = 'HIGH' | 'MEDIUM' | 'LOW';

interface PlanStep {
  type: PlanType;
  title: string;
  details?: string;
  priority: PlanPriority;
  places: string[];
}

interface DailyTask {
  date: string;
  title: string;
  details?: string;
  priority: PlanPriority;
  acquisitionType: PlanType;
  places: string[];
  expectedAcquisitions: number;
  checklist: string[];
}

interface WeeklyPlan {
  id: string;
  weekStart: string;
  weekEnd: string;
  weeklyTarget: number;
  status: PlanStatus;
  ownerComment?: string;
  steps: PlanStep[];
  places: string[];
  dailyTasks: DailyTask[];
}

interface DashboardData {
  date: string;
  individualCount: number;
  businessCount: number;
  individualTarget: number;
  businessTarget: number;
  plan: WeeklyPlan | null;
  todayTask: DailyTask | null;
  performance: {
    weekStart: string;
    weekEnd: string;
    daily: {
      individualTarget: number;
      businessTarget: number;
      target: number;
      individualActual: number;
      businessActual: number;
      actual: number;
      grade: string;
      scorePct: number;
    };
    weekly: {
      target: number | null;
      individualActual: number;
      businessActual: number;
      actual: number;
      grade: string;
      scorePct: number;
    };
  };
  recentLogs: {
    id: string;
    type: string;
    source: string;
    notes?: string;
    customer?: { name: string; phone: string };
    businessLead?: { companyName: string };
    createdAt: string;
  }[];
  followUps: {
    id: string;
    companyName: string;
    contactPerson?: string;
    status: string;
    followUpDate: string;
  }[];
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-surface-elevated rounded-full h-2.5 mt-2">
      <div
        className={`h-2.5 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const PRIORITY_STYLES: Record<PlanPriority, string> = {
  HIGH: 'bg-error/10 text-error border-error/20',
  MEDIUM: 'bg-warning/10 text-warning border-warning/20',
  LOW: 'bg-info/10 text-info border-info/20',
};

const STATUS_STYLES: Record<PlanStatus, string> = {
  DRAFT: 'bg-surface-elevated text-text-secondary border-border-subtle',
  SUBMITTED: 'bg-info/10 text-info border-info/20',
  APPROVED: 'bg-success/10 text-success border-success/20',
  REJECTED: 'bg-error/10 text-error border-error/20',
};

export default function SalesDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date] = useState(today);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [weeklyTarget, setWeeklyTarget] = useState('25');
  const [steps, setSteps] = useState<Array<{ type: PlanType; title: string; details: string; priority: PlanPriority; placesText: string }>>([
    { type: 'INDIVIDUAL', title: '', details: '', priority: 'HIGH', placesText: '' },
  ]);

  const applyPlanToForm = useCallback((plan: WeeklyPlan | null) => {
    if (!plan) return;
    setWeeklyTarget(String(plan.weeklyTarget));
    setSteps(
      plan.steps.length > 0
        ? plan.steps.map((step) => ({
            type: step.type,
            title: step.title,
            details: step.details ?? '',
            priority: step.priority,
            placesText: step.places.join(', '),
          }))
        : [{ type: 'INDIVIDUAL', title: '', details: '', priority: 'HIGH', placesText: '' }]
    );
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await get<DashboardData>(API_PATHS.sales.dashboard(date));
      setData(res);
      applyPlanToForm(res.plan);
      setError('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [date, applyPlanToForm]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageSkeleton />;
  if (!data) return null;

  const currentPlan = data.plan;
  const isLocked = currentPlan?.status === 'APPROVED' || currentPlan?.status === 'SUBMITTED';

  const toPayload = () => ({
    weekStart: data.performance.weekStart,
    weeklyTarget: Math.max(1, Number(weeklyTarget) || 0),
    steps: steps
      .map((step) => ({
        type: step.type,
        title: step.title.trim(),
        details: step.details.trim() || undefined,
        priority: step.priority,
        places: step.placesText
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean),
      }))
      .filter((step) => step.title && step.places.length > 0),
  });

  const saveDraft = async () => {
    const payload = toPayload();
    if (payload.steps.length === 0) {
      setError('Add at least one step with at least one place.');
      return null;
    }

    setSaving(true);
    setError('');
    try {
      const plan = await post<WeeklyPlan>(API_PATHS.sales.upsertWeeklyPlan, payload);
      setData((prev) => (prev ? { ...prev, plan } : prev));
      applyPlanToForm(plan);
      return plan;
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save weekly draft.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const submitPlan = async () => {
    setSubmitting(true);
    setError('');
    try {
      let plan = currentPlan;
      if (!plan || plan.status === 'DRAFT' || plan.status === 'REJECTED') {
        plan = await saveDraft();
      }
      if (!plan) return;

      if (plan.status === 'REJECTED') {
        await post(API_PATHS.sales.resubmitWeeklyPlan(plan.id), {});
      } else {
        await post(API_PATHS.sales.submitWeeklyPlan(plan.id), {});
      }
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to submit weekly plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const dailyPct = data.performance.daily.target > 0
    ? Math.round((data.performance.daily.actual / data.performance.daily.target) * 100)
    : 0;
  const weeklyPct = data.performance.weekly.target
    ? Math.round((data.performance.weekly.actual / data.performance.weekly.target) * 100)
    : 0;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Sales Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {currentPlan && (
        <div className="rounded-3xl border border-info/20 bg-info/10 p-4 text-sm text-text-primary">
          {currentPlan.status === 'DRAFT' && (
            <p>
              Your weekly plan is still a draft. Save it to generate daily tasks, then submit it for owner approval.
            </p>
          )}
          {currentPlan.status === 'SUBMITTED' && (
            <p>
              Plan submitted and waiting for approval. Keep logging customers and businesses today while you await feedback.
            </p>
          )}
          {currentPlan.status === 'APPROVED' && (
            <p>
              Plan approved. Follow today&apos;s task and use the customer/business progress below to stay on target.
            </p>
          )}
          {currentPlan.status === 'REJECTED' && (
            <p>
              Your plan was rejected. Update the steps based on the owner feedback above, then resubmit.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {currentPlan && (
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-info" />
              <p className="text-sm text-text-secondary">
                Week {new Date(currentPlan.weekStart + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                {' - '}
                {new Date(currentPlan.weekEnd + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs border font-semibold ${STATUS_STYLES[currentPlan.status]}`}>
              {currentPlan.status}
            </span>
          </div>
          {currentPlan.ownerComment && (
            <div className="mt-3 rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-xs text-error">
              Owner feedback: {currentPlan.ownerComment}
            </div>
          )}
        </div>
      )}

      {/* Progress cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} className="text-info" />
            <span className="text-sm font-medium text-text-primary">Daily Performance</span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold text-text-primary">{data.performance.daily.actual}</span>
            <span className="text-sm text-text-secondary">/ {data.performance.daily.target} target</span>
          </div>
          <ProgressBar value={data.performance.daily.actual} max={data.performance.daily.target} color="bg-info" />
          <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary mt-3">
            <div>Customers: {data.performance.daily.individualActual} / {data.performance.daily.individualTarget}</div>
            <div>Businesses: {data.performance.daily.businessActual} / {data.performance.daily.businessTarget}</div>
          </div>
          <p className="text-xs text-text-secondary mt-1.5">{dailyPct}% complete · Grade {data.performance.daily.grade}</p>
        </div>

        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Flag size={18} className="text-warning" />
            <span className="text-sm font-medium text-text-primary">Weekly Performance</span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold text-text-primary">{data.performance.weekly.actual}</span>
            <span className="text-sm text-text-secondary">/ {data.performance.weekly.target ?? 0} target</span>
          </div>
          <ProgressBar value={data.performance.weekly.actual} max={data.performance.weekly.target ?? 0} color="bg-warning" />
          <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary mt-3">
            <div>Customers: {data.performance.weekly.individualActual}</div>
            <div>Businesses: {data.performance.weekly.businessActual}</div>
          </div>
          <p className="text-xs text-text-secondary mt-1.5">{weeklyPct}% complete · Grade {data.performance.weekly.grade}</p>
        </div>
      </div>

      <div className="bg-surface-raised border border-border-subtle rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-info" />
          <h2 className="text-sm font-semibold text-text-primary">Weekly Target Plan</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Weekly target</label>
            <Input
              type="number"
              min={1}
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(e.target.value)}
              disabled={isLocked}
            />
          </div>
          <div className="text-xs text-text-secondary self-end">
            Daily tasks are auto-generated from these steps once you save the draft.
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={`step-${idx}`} className="space-y-3 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Step title"
                  value={step.title}
                  onChange={(e) => {
                    const next = [...steps];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setSteps(next);
                  }}
                  disabled={isLocked}
                />
                <select
                  value={step.type}
                  onChange={(e) => {
                    const next = [...steps];
                    next[idx] = { ...next[idx], type: e.target.value as PlanType };
                    setSteps(next);
                  }}
                  disabled={isLocked}
                  className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="BUSINESS">Business</option>
                </select>
                <select
                  value={step.priority}
                  onChange={(e) => {
                    const next = [...steps];
                    next[idx] = { ...next[idx], priority: e.target.value as PlanPriority };
                    setSteps(next);
                  }}
                  disabled={isLocked}
                  className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
              <Input
                placeholder="Places to visit (comma-separated)"
                value={step.placesText}
                onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...next[idx], placesText: e.target.value };
                  setSteps(next);
                }}
                disabled={isLocked}
              />
              <textarea
                value={step.details}
                onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...next[idx], details: e.target.value };
                  setSteps(next);
                }}
                disabled={isLocked}
                rows={2}
                placeholder="Execution detail"
                className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary"
              />
            </div>
          ))}
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={() => setSteps((prev) => [...prev, { type: 'INDIVIDUAL', title: '', details: '', priority: 'MEDIUM', placesText: '' }])}
            className="inline-flex items-center gap-2 text-xs font-semibold text-info"
          >
            <Plus size={14} /> Add another step
          </button>
        )}
        {!isLocked && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveDraft} disabled={saving || submitting}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={submitPlan} disabled={saving || submitting}>
              {submitting
                ? 'Submitting...'
                : currentPlan?.status === 'REJECTED'
                  ? 'Resubmit for Approval'
                  : 'Submit for Approval'}
            </Button>
          </div>
        )}
      </div>

      {data.plan && data.plan.dailyTasks.length > 0 && (
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-info" />
            <h2 className="text-sm font-semibold text-text-primary">Daily Target Breakdown</h2>
          </div>
          <div className="space-y-3">
            {data.plan.dailyTasks.map((task) => (
              <div key={task.date} className="rounded-2xl border border-border-subtle bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-text-secondary uppercase tracking-[0.18em]">
                      {new Date(task.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-sm font-semibold text-text-primary mt-1 truncate">{task.title}</p>
                  </div>
                  <span className={`text-[11px] rounded-full px-2 py-1 ${task.acquisitionType === 'INDIVIDUAL' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
                    {task.acquisitionType}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary mt-3">
                  <div className="truncate">Target: {task.expectedAcquisitions}</div>
                  <div className="truncate">Priority: {task.priority}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.todayTask && (
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Auto Task</h2>
              <p className="text-xs text-text-secondary">Type: {data.todayTask.acquisitionType}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full border ${PRIORITY_STYLES[data.todayTask.priority]}`}>
              {data.todayTask.priority}
            </span>
          </div>
          <p className="text-sm font-medium text-text-primary">{data.todayTask.title}</p>
          {data.todayTask.details && <p className="text-xs text-text-secondary mt-1">{data.todayTask.details}</p>}
          <p className="text-xs text-text-secondary mt-2">Places: {data.todayTask.places.join(', ')}</p>
          <p className="text-xs text-text-secondary">Expected acquisitions: {data.todayTask.expectedAcquisitions}</p>
          <ul className="mt-3 space-y-1">
            {data.todayTask.checklist.map((item) => (
              <li key={item} className="text-xs text-text-secondary">• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/sales/customers"
          className="flex items-center justify-between bg-surface-raised border border-border-subtle rounded-xl p-3 sm:p-4 hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Target size={18} className="text-info flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-text-primary truncate">Log Individual</span>
          </div>
          <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
        </Link>
        <Link
          href="/sales/businesses"
          className="flex items-center justify-between bg-surface-raised border border-border-subtle rounded-xl p-3 sm:p-4 hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Flag size={18} className="text-warning flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-text-primary truncate">B2B Pipeline</span>
          </div>
          <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
        </Link>
      </div>

      {/* Follow-up reminders */}
      {data.followUps.length > 0 && (
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-warning" />
            <h2 className="text-sm font-semibold text-text-primary">Follow-up Reminders</h2>
          </div>
          <ul className="space-y-2">
            {data.followUps.map((f) => (
              <li key={f.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{f.companyName}</p>
                  {f.contactPerson && <p className="text-xs text-text-secondary">{f.contactPerson}</p>}
                </div>
                <div className="text-right">
                  <span className="text-xs text-warning font-medium">
                    {new Date(f.followUpDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <p className="text-xs text-text-secondary capitalize">{f.status.toLowerCase()}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/sales/businesses" className="text-xs text-info mt-3 inline-block hover:underline">
            View all businesses →
          </Link>
        </div>
      )}

      {/* Recent activity */}
      {data.recentLogs.length > 0 && (
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Today&apos;s Activity</h2>
          <ul className="space-y-2.5">
            {data.recentLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-1.5 rounded-full ${log.type === 'INDIVIDUAL' ? 'bg-info/10' : 'bg-warning/10'}`}
                >
                  <Target size={12} className={log.type === 'INDIVIDUAL' ? 'text-info' : 'text-warning'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {log.type === 'INDIVIDUAL'
                      ? (log.customer?.name ?? 'Unknown')
                      : (log.businessLead?.companyName ?? 'Unknown')}
                  </p>
                  <p className="text-xs text-text-secondary">{log.source}{log.notes && ` · ${log.notes}`}</p>
                </div>
                <span className="text-xs text-text-secondary whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
