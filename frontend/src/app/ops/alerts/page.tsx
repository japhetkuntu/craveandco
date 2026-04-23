'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, patch } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

export default function OpsAlertsPage() {
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
        get(`${API_PATHS.alerts.list}${buildQueryString(params)}`, token),
        get(API_PATHS.alerts.summary, token),
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
      await patch(API_PATHS.alerts.acknowledge(id), {}, token);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string) => {
    if (!token) return;
    try {
      await patch(API_PATHS.alerts.resolve(id), {}, token);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const severityColor: Record<string, string> = {
    INFO: 'bg-info-muted border-border-default',
    WARNING: 'bg-warning-muted border-border-default',
    CRITICAL: 'bg-error-muted border-border-default',
  };

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  const totalAlerts = summary?.total ?? alerts.length;
  const openAlerts = summary?.open ?? alerts.filter((alert) => alert.status === 'OPEN').length;
  const acknowledgedAlerts = summary?.acknowledged ?? alerts.filter((alert) => alert.status === 'ACKNOWLEDGED').length;
  const resolvedAlerts = summary?.resolved ?? alerts.filter((alert) => alert.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="text-gold" /> Alerts
          </h1>
          <p className="text-sm text-text-secondary mt-1">View and manage open alerts for your branch.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => { setStatusFilter(status as 'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'); setPage(0); }}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                statusFilter === status ? 'bg-gold text-white' : 'bg-surface-raised text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              {status}
            </button>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => fetchAlerts()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-surface-raised p-4 text-sm">
          <p className="font-semibold text-text-primary">Total alerts</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{totalAlerts}</p>
        </div>
        <div className="rounded-3xl bg-surface-raised p-4 text-sm">
          <p className="font-semibold text-text-primary">Open</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{openAlerts}</p>
        </div>
        <div className="rounded-3xl bg-surface-raised p-4 text-sm">
          <p className="font-semibold text-text-primary">Acknowledged</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{acknowledgedAlerts}</p>
        </div>
        <div className="rounded-3xl bg-surface-raised p-4 text-sm">
          <p className="font-semibold text-text-primary">Resolved</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{resolvedAlerts}</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-surface-raised p-4 text-sm">
            <p className="font-semibold text-text-primary">Critical</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{summary.bySeverity.CRITICAL}</p>
          </div>
          <div className="rounded-3xl bg-surface-raised p-4 text-sm">
            <p className="font-semibold text-text-primary">Warning</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{summary.bySeverity.WARNING}</p>
          </div>
          <div className="rounded-3xl bg-surface-raised p-4 text-sm">
            <p className="font-semibold text-text-primary">Info</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{summary.bySeverity.INFO}</p>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">No alerts — all clear!</p>
      ) : (
        <>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border ${severityColor[alert.severity] || 'bg-surface-base border-border-default'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={alert.status} />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-raised font-medium text-text-secondary border">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary mt-1">{alert.message}</p>
                    <p className="text-xs text-text-tertiary mt-1">{new Date(alert.createdAt).toLocaleString('en-GH')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {alert.status === 'OPEN' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(alert.id)}>
                          Acknowledge
                        </Button>
                        <Button size="sm" onClick={() => handleResolve(alert.id)}>
                          <CheckCircle size={14} /> Resolve
                        </Button>
                      </>
                    )}
                    {alert.status === 'ACKNOWLEDGED' && (
                      <Button size="sm" onClick={() => handleResolve(alert.id)}>
                        <CheckCircle size={14} /> Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(0); }}
            hasMore={alerts.length === limit}
          />
        </>
      )}
    </div>
  );
}
