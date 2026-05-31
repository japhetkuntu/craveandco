'use client';

import { useState, useEffect, useCallback } from 'react';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { PageSkeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { UserPlus, Building2, TrendingUp, Trophy, CheckCircle2, XCircle, CalendarDays, ClipboardList } from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';

const RANGE_OPTIONS = [
  { label: 'Today', fromBack: 0, toBack: 0 },
  { label: 'Yesterday', fromBack: 1, toBack: 1 },
  { label: '7 days', fromBack: 6, toBack: 0 },
  { label: '30 days', fromBack: 29, toBack: 0 },
];

function offsetDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

interface Analytics {
  totalIndividual: number;
  totalBusiness: number;
  totalAcquisitions: number;
  byExecutive: { executiveId: string; name: string; count: number }[];
  bySource: { source: string; count: number }[];
  businessByStatus: { status: string; count: number }[];
}

interface Executive {
  id: string;
  name: string;
  email: string;
}

interface WeeklyPlanStep {
  type: 'INDIVIDUAL' | 'BUSINESS';
  title: string;
  details?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  places: string[];
}

interface PendingWeeklyPlan {
  id: string;
  weekStart: string;
  weekEnd: string;
  weeklyTarget: number;
  status: 'SUBMITTED';
  submittedAt?: string;
  executive: Executive;
  steps: WeeklyPlanStep[];
}

const SOURCE_LABELS: Record<string, string> = {
  COLD_CALL: 'Cold Call',
  WALK_IN_VISIT: 'Walk-in Visit',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  EVENT: 'Event',
  EMAIL_OUTREACH: 'Email Outreach',
  OTHER: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  CONTACTED: 'text-info',
  PITCHED: 'text-warning',
  NEGOTIATING: 'text-warning',
  SIGNED: 'text-success',
  LOST: 'text-error',
};

export default function OwnerSalesPage() {
  const [rangeIdx, setRangeIdx] = useState(2); // 7 days default
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [pendingPlans, setPendingPlans] = useState<PendingWeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectDrafts, setRejectDrafts] = useState<Record<string, string>>({});
  const [planWeekStart, setPlanWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const offset = (day + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - offset);
    return monday.toISOString().slice(0, 10);
  });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = offsetDate(RANGE_OPTIONS[rangeIdx].fromBack);
      const to = offsetDate(RANGE_OPTIONS[rangeIdx].toBack);
      const [analyticsRes, execRes, pendingRes] = await Promise.all([
        get<Analytics>(API_PATHS.sales.analytics(from, to)),
        get<Executive[]>(API_PATHS.sales.executives),
        get<PendingWeeklyPlan[]>(API_PATHS.sales.pendingWeeklyPlans(planWeekStart)),
      ]);
      setAnalytics(analyticsRes);
      setExecutives(execRes);
      setPendingPlans(pendingRes);
      setError('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load sales data.');
    } finally {
      setLoading(false);
    }
  }, [rangeIdx, planWeekStart]);

  useEffect(() => { load(); }, [load]);

  const approvePlan = async (id: string) => {
    setReviewingId(id);
    try {
      await post(API_PATHS.sales.approveWeeklyPlan(id), {});
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to approve weekly plan.');
    } finally {
      setReviewingId(null);
    }
  };

  const rejectPlan = async (id: string) => {
    const comment = (rejectDrafts[id] ?? '').trim();
    if (!comment) {
      setError('Rejection comment is required before rejecting a plan.');
      return;
    }
    setReviewingId(id);
    try {
      await post(API_PATHS.sales.rejectWeeklyPlan(id), { comment });
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to reject weekly plan.');
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!analytics) return null;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Sales Analytics</h1>
          <p className="text-sm text-text-secondary mt-0.5">Customer acquisition performance across your team</p>
        </div>
        <ExportButton
          filename="sales-analytics"
          sheets={[
            {
              name: 'By Executive',
              data: analytics.byExecutive,
              columns: [
                { header: 'Executive', value: (e) => e.name },
                { header: 'Acquisitions', value: (e) => e.count },
              ],
            },
            {
              name: 'By Source',
              data: analytics.bySource,
              columns: [
                { header: 'Source', value: (s) => SOURCE_LABELS[s.source] ?? s.source },
                { header: 'Count', value: (s) => s.count },
              ],
            },
            {
              name: 'By Business Status',
              data: analytics.businessByStatus,
              columns: [
                { header: 'Status', value: (b) => b.status },
                { header: 'Count', value: (b) => b.count },
              ],
            },
          ]}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Range selector */}
      <div className="flex gap-2 flex-wrap">
        {RANGE_OPTIONS.map((r, i) => (
          <button
            key={r.label}
            onClick={() => setRangeIdx(i)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              rangeIdx === i
                ? 'text-black border-transparent'
                : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
            style={rangeIdx === i ? { backgroundColor: 'var(--color-gold)' } : {}}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Acquisitions"
          value={analytics.totalAcquisitions}
          icon={<TrendingUp size={18} className="text-success" />}
        />
        <KPICard
          title="Individual Customers"
          value={analytics.totalIndividual}
          icon={<UserPlus size={18} className="text-info" />}
        />
        <KPICard
          title="Business Leads"
          value={analytics.totalBusiness}
          icon={<Building2 size={18} className="text-warning" />}
        />
      </div>

      {/* Executive leaderboard */}
      {analytics.byExecutive.length > 0 && (
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-warning" />
            <h2 className="text-sm font-semibold text-text-primary">Executive Leaderboard</h2>
          </div>
          <div className="space-y-2">
            {analytics.byExecutive.map((e, i) => {
              const max = analytics.byExecutive[0].count;
              return (
                <div key={e.executiveId} className="flex items-center gap-2 sm:gap-3">
                  <span className={`text-xs font-bold w-5 flex-shrink-0 ${i === 0 ? 'text-warning' : 'text-text-secondary'}`}>
                    #{i + 1}
                  </span>
                  <span className="text-sm text-text-primary w-24 sm:w-32 truncate flex-shrink-0">{e.name}</span>
                  <div className="flex-1 bg-surface-elevated rounded-full h-2 min-w-0">
                    <div
                      className="h-2 rounded-full bg-info"
                      style={{ width: max > 0 ? `${(e.count / max) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-text-primary w-8 text-right flex-shrink-0">{e.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Source breakdown + Business pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* By source */}
        {analytics.bySource.length > 0 && (
          <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">By Acquisition Source</h2>
            <ul className="space-y-2">
              {analytics.bySource.map((s) => (
                <li key={s.source} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{SOURCE_LABELS[s.source] ?? s.source}</span>
                  <span className="font-semibold text-text-primary">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Business pipeline status */}
        {analytics.businessByStatus.length > 0 && (
          <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Business Pipeline Status</h2>
            <ul className="space-y-2">
              {analytics.businessByStatus.map((b) => (
                <li key={b.status} className="flex items-center justify-between text-sm">
                  <span className={`capitalize ${STATUS_COLORS[b.status] ?? 'text-text-secondary'}`}>
                    {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                  </span>
                  <span className="font-semibold text-text-primary">{b.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-surface-raised border border-border-subtle rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-info" />
            <h2 className="text-sm font-semibold text-text-primary">Weekly Target Reviews</h2>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-text-secondary" />
            <input
              type="date"
              value={planWeekStart}
              onChange={(e) => setPlanWeekStart(e.target.value)}
              className="bg-surface-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none"
            />
          </div>
        </div>

        {pendingPlans.length === 0 ? (
          <div className="text-sm text-text-secondary">No submitted weekly plans for this week.</div>
        ) : (
          <div className="space-y-3">
            {pendingPlans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-border-subtle p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{plan.executive.name}</p>
                    <p className="text-xs text-text-secondary">{plan.executive.email}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Weekly target: <span className="font-semibold text-text-primary">{plan.weeklyTarget}</span>
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full border border-info/20 bg-info/10 text-info font-semibold">
                    SUBMITTED
                  </span>
                </div>

                <div className="space-y-2">
                  {plan.steps.map((step, idx) => (
                    <div key={`${plan.id}-step-${idx}`} className="rounded-lg bg-surface-elevated p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{step.title}</p>
                          <p className="text-[11px] text-text-secondary">Type: {step.type}</p>
                        </div>
                        <span className="text-[11px] rounded-full border border-border-subtle px-2 py-1 text-text-secondary">
                          {step.priority}
                        </span>
                      </div>
                      {step.details && <p className="text-xs text-text-secondary mt-1">{step.details}</p>}
                      <p className="text-xs text-text-secondary mt-1">Places: {step.places.join(', ')}</p>
                    </div>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={rejectDrafts[plan.id] ?? ''}
                  onChange={(e) => setRejectDrafts((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                  placeholder="Rejection comment (required if rejecting)"
                  className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => approvePlan(plan.id)}
                    disabled={reviewingId === plan.id}
                    className="inline-flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} />
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => rejectPlan(plan.id)}
                    disabled={reviewingId === plan.id}
                    className="inline-flex items-center gap-2"
                  >
                    <XCircle size={14} />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {executives.length === 0 && (
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5 text-center text-sm text-text-secondary">
          No Sales Executives have been added to your branch yet.
          <br />
          Create a staff member with the SALES_EXECUTIVE role to get started.
        </div>
      )}
    </div>
  );
}
