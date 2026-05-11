'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, patch } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface Alert {
  id: string;
  severity: string;
  status: string;
  message: string;
  createdAt: string;
}

interface AlertSummary {
  total: number;
  open: number;
  acknowledged: number;
  resolved: number;
  bySeverity: {
    INFO: number;
    WARNING: number;
    CRITICAL: number;
  };
}

export default function OwnerAlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');

  const fetchAlerts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      };
      const [data, summaryData] = await Promise.all([
        get(`/api/v1/alerts${buildQueryString(params)}`, token),
        get('/api/v1/alerts/summary', token),
      ]);
      setAlerts(data);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAlerts();
  }, [token, statusFilter, page, limit]);

  const handleAcknowledge = async (id: string) => {
    if (!token) return;
    try {
      await patch(`/api/v1/alerts/${id}/acknowledge`, {}, token);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string) => {
    if (!token) return;
    try {
      await patch(`/api/v1/alerts/${id}/resolve`, {}, token);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <PageSkeleton />;

  const totalAlerts = summary?.total ?? alerts.length;
  const openAlerts = summary?.open ?? alerts.filter((a) => a.status === 'OPEN').length;
  const acknowledgedAlerts = summary?.acknowledged ?? alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const resolvedAlerts = summary?.resolved ?? alerts.filter((a) => a.status === 'RESOLVED').length;

  const severityBg: Record<string, string> = {
    INFO: 'bg-info-muted border-info/30',
    WARNING: 'bg-warning-muted border-warning/30',
    CRITICAL: 'bg-error-muted border-error/30',
  };
  const severityText: Record<string, string> = {
    INFO: 'text-info',
    WARNING: 'text-warning',
    CRITICAL: 'text-error',
  };

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="text-[var(--color-gold)]" /> Alerts
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Monitor and respond to system alerts</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => fetchAlerts()}>Refresh</Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalAlerts, tone: undefined },
          { label: 'Open', value: openAlerts, tone: openAlerts > 0 ? 'red' as const : 'green' as const },
          { label: 'Acknowledged', value: acknowledgedAlerts, tone: undefined },
          { label: 'Resolved', value: resolvedAlerts, tone: resolvedAlerts > 0 ? 'green' as const : undefined },
        ].map(({ label, value, tone }) => {
          const bg = tone === 'green' ? 'bg-success-muted border-success/30' : tone === 'red' ? 'bg-error-muted border-error/30' : 'bg-surface-raised border-border-subtle';
          const tv = tone === 'green' ? 'text-success' : tone === 'red' ? 'text-error' : 'text-text-primary';
          return (
            <div key={label} className={`rounded-2xl border p-4 flex flex-col gap-2 ${bg}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest ${tv}`}>{label}</p>
              <p className={`text-3xl font-bold font-mono ${tv}`}>{value}</p>
            </div>
          );
        })}
      </div>

      {/* Severity breakdown */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-error-muted border border-error/30 p-3 text-center">
            <p className="text-xs font-semibold text-error uppercase">Critical</p>
            <p className="text-2xl font-bold font-mono text-error mt-1">{summary.bySeverity.CRITICAL}</p>
          </div>
          <div className="rounded-2xl bg-warning-muted border border-warning/30 p-3 text-center">
            <p className="text-xs font-semibold text-warning uppercase">Warning</p>
            <p className="text-2xl font-bold font-mono text-warning mt-1">{summary.bySeverity.WARNING}</p>
          </div>
          <div className="rounded-2xl bg-info-muted border border-info/30 p-3 text-center">
            <p className="text-xs font-semibold text-info uppercase">Info</p>
            <p className="text-2xl font-bold font-mono text-info mt-1">{summary.bySeverity.INFO}</p>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-[var(--color-gold)] text-white shadow-sm'
                : 'bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            {s === 'ALL' ? 'All Alerts' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <CheckCircle size={32} className="text-success opacity-60" />
            <p className="text-sm font-semibold text-text-secondary">All clear — no alerts</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border-subtle">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border-l-4 ${severityBg[alert.severity] || 'bg-surface-raised border-border-default'} border-l-current`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-widest ${severityText[alert.severity] || 'text-text-secondary'}`}>
                          {alert.severity}
                        </span>
                        <StatusBadge status={alert.status} />
                      </div>
                      <p className="text-sm font-medium text-text-primary">{alert.message}</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(alert.createdAt).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    {alert.status !== 'RESOLVED' && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {alert.status === 'OPEN' && (
                          <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                        <Button size="sm" onClick={() => handleResolve(alert.id)}>
                          <CheckCircle size={14} /> Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 pt-2">
              <PaginationControls
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(value) => { setLimit(value); setPage(0); }}
                hasMore={alerts.length === limit}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
