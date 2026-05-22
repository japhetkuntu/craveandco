'use client';

import { useState, useEffect, useCallback } from 'react';
import { get, post } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { PageSkeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Building2, TrendingUp, Target, Trophy } from 'lucide-react';
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

interface TargetForm {
  userId: string;
  individualTarget: number;
  businessTarget: number;
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
  const [loading, setLoading] = useState(true);
  const [targetForms, setTargetForms] = useState<TargetForm[]>([]);
  const [savingTargets, setSavingTargets] = useState(false);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = offsetDate(RANGE_OPTIONS[rangeIdx].fromBack);
      const to = offsetDate(RANGE_OPTIONS[rangeIdx].toBack);
      const [analyticsRes, execRes] = await Promise.all([
        get<Analytics>(API_PATHS.sales.analytics(from, to)),
        get<Executive[]>(API_PATHS.sales.executives),
      ]);
      setAnalytics(analyticsRes);
      setExecutives(execRes);
    } finally {
      setLoading(false);
    }
  }, [rangeIdx]);

  const loadTargets = useCallback(async () => {
    if (executives.length === 0) return;
    try {
      const targets = await get<{ userId: string; individualTarget: number; businessTarget: number }[]>(
        API_PATHS.sales.branchTargets(targetDate)
      );
      setTargetForms(
        executives.map((e) => {
          const t = targets.find((x) => x.userId === e.id);
          return { userId: e.id, individualTarget: t?.individualTarget ?? 5, businessTarget: t?.businessTarget ?? 2 };
        })
      );
    } catch {
      setTargetForms(executives.map((e) => ({ userId: e.id, individualTarget: 5, businessTarget: 2 })));
    }
  }, [executives, targetDate]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTargets(); }, [loadTargets]);

  const handleSaveTargets = async () => {
    setSavingTargets(true);
    try {
      await Promise.all(
        targetForms.map((tf) =>
          post(API_PATHS.sales.upsertTarget, { ...tf, date: targetDate })
        )
      );
    } finally {
      setSavingTargets(false);
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

      {/* Set daily targets */}
      {executives.length > 0 && (
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-info" />
            <h2 className="text-sm font-semibold text-text-primary">Set Daily Targets</h2>
          </div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <label className="text-xs text-text-secondary whitespace-nowrap">Target date:</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-surface-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-info"
            />
          </div>
          <div className="space-y-4">
            {executives.map((exec, i) => (
              <div key={exec.id} className="space-y-2">
                <span className="text-sm font-medium text-text-primary truncate block">{exec.name}</span>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-secondary whitespace-nowrap">Individuals:</label>
                    <input
                      type="number"
                      min={0}
                      value={targetForms[i]?.individualTarget ?? 5}
                      onChange={(e) => {
                        const newForms = [...targetForms];
                        newForms[i] = { ...newForms[i], individualTarget: parseInt(e.target.value) || 0 };
                        setTargetForms(newForms);
                      }}
                      className="w-16 bg-surface-elevated border border-border-subtle rounded-lg px-2 py-1 text-sm text-text-primary text-center focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-secondary whitespace-nowrap">Businesses:</label>
                    <input
                      type="number"
                      min={0}
                      value={targetForms[i]?.businessTarget ?? 2}
                      onChange={(e) => {
                        const newForms = [...targetForms];
                        newForms[i] = { ...newForms[i], businessTarget: parseInt(e.target.value) || 0 };
                        setTargetForms(newForms);
                      }}
                      className="w-16 bg-surface-elevated border border-border-subtle rounded-lg px-2 py-1 text-sm text-text-primary text-center focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={handleSaveTargets}
            disabled={savingTargets}
            className="mt-4 w-full sm:w-auto"
          >
            {savingTargets ? 'Saving...' : 'Save Targets'}
          </Button>
        </div>
      )}

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
