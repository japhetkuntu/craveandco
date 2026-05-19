'use client';

import { useState, useEffect, useCallback } from 'react';
import { get } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { PageSkeleton } from '@/components/ui/skeleton';
import { UserPlus, Building2, Target, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  date: string;
  individualCount: number;
  businessCount: number;
  individualTarget: number;
  businessTarget: number;
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

const SOURCE_LABELS: Record<string, string> = {
  COLD_CALL: 'Cold Call',
  WALK_IN_VISIT: 'Walk-in Visit',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  EVENT: 'Event',
  EMAIL_OUTREACH: 'Email Outreach',
  OTHER: 'Other',
};

export default function SalesDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date] = useState(today);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await get<DashboardData>(API_PATHS.sales.dashboard(date));
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageSkeleton />;
  if (!data) return null;

  const individualPct = data.individualTarget > 0
    ? Math.round((data.individualCount / data.individualTarget) * 100)
    : 0;
  const businessPct = data.businessTarget > 0
    ? Math.round((data.businessCount / data.businessTarget) * 100)
    : 0;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Sales Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Progress cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Individual */}
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={18} className="text-info" />
            <span className="text-sm font-medium text-text-primary">Individual Acquisitions</span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold text-text-primary">{data.individualCount}</span>
            <span className="text-sm text-text-secondary">/ {data.individualTarget} target</span>
          </div>
          <ProgressBar value={data.individualCount} max={data.individualTarget} color="bg-info" />
          <p className="text-xs text-text-secondary mt-1.5">{individualPct}% complete</p>
        </div>

        {/* Business */}
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={18} className="text-warning" />
            <span className="text-sm font-medium text-text-primary">Business Acquisitions</span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-bold text-text-primary">{data.businessCount}</span>
            <span className="text-sm text-text-secondary">/ {data.businessTarget} target</span>
          </div>
          <ProgressBar value={data.businessCount} max={data.businessTarget} color="bg-warning" />
          <p className="text-xs text-text-secondary mt-1.5">{businessPct}% complete</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/sales/customers"
          className="flex items-center justify-between bg-surface-raised border border-border-subtle rounded-xl p-3 sm:p-4 hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <UserPlus size={18} className="text-info flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-text-primary truncate">Log Individual</span>
          </div>
          <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
        </Link>
        <Link
          href="/sales/businesses"
          className="flex items-center justify-between bg-surface-raised border border-border-subtle rounded-xl p-3 sm:p-4 hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Building2 size={18} className="text-warning flex-shrink-0" />
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
                  {log.type === 'INDIVIDUAL' ? (
                    <UserPlus size={12} className="text-info" />
                  ) : (
                    <Building2 size={12} className="text-warning" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {log.type === 'INDIVIDUAL'
                      ? (log.customer?.name ?? 'Unknown')
                      : (log.businessLead?.companyName ?? 'Unknown')}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {SOURCE_LABELS[log.source] ?? log.source}
                    {log.notes && ` · ${log.notes}`}
                  </p>
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
