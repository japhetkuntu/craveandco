'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, patch } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
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
  bySeverity: { INFO: number; WARNING: number; CRITICAL: number };
}

// Plain-language tab labels
const FILTER_TABS = [
  { value: 'ALL', label: 'All', description: 'Show every alert' },
  { value: 'OPEN', label: 'Needs Action', description: 'New alerts that need your attention' },
  { value: 'ACKNOWLEDGED', label: 'Seen', description: "Alerts you've noted but not resolved" },
  { value: 'RESOLVED', label: 'Resolved', description: 'Alerts that are taken care of' },
] as const;

const severityStyle: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  CRITICAL: {
    bg: 'bg-error-muted',
    border: 'border-error/40',
    icon: <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />,
    label: 'Urgent',
  },
  WARNING: {
    bg: 'bg-warning-muted',
    border: 'border-warning/40',
    icon: <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />,
    label: 'Warning',
  },
  INFO: {
    bg: 'bg-info-muted',
    border: 'border-border-subtle',
    icon: <Info size={16} className="text-info shrink-0 mt-0.5" />,
    label: 'Info',
  },
};

export default function OpsAlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit] = useState(15);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'>('OPEN');
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = { page, limit, status: statusFilter === 'ALL' ? undefined : statusFilter };
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

  useEffect(() => { void fetchAlerts(); }, [token, statusFilter, page]);

  const handleAcknowledge = async (id: string) => {
    if (!token) return;
    setActingId(id);
    try {
      await patch(API_PATHS.alerts.acknowledge(id), {}, token);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)));
      if (summary) setSummary({ ...summary, open: summary.open - 1, acknowledged: summary.acknowledged + 1 });
    } catch (err) { console.error(err); }
    finally { setActingId(null); }
  };

  const handleResolve = async (id: string) => {
    if (!token) return;
    setActingId(id);
    try {
      await patch(API_PATHS.alerts.resolve(id), {}, token);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a)));
    } catch (err) { console.error(err); }
    finally { setActingId(null); }
  };

  const openCount = summary?.open ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="text-gold" /> Alerts
          </h1>
          {openCount > 0 ? (
            <p className="text-sm text-warning font-medium mt-1">
              {openCount} alert{openCount > 1 ? 's' : ''} need{openCount === 1 ? 's' : ''} your attention
            </p>
          ) : (
            <p className="text-sm text-success font-medium mt-1">No open alerts — all clear!</p>
          )}
        </div>
        <button
          onClick={() => fetchAlerts()}
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary counts */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Needs Action', value: summary.open, tone: summary.open > 0 ? 'text-error' : 'text-text-primary' },
            { label: 'Urgent (Critical)', value: summary.bySeverity.CRITICAL, tone: summary.bySeverity.CRITICAL > 0 ? 'text-error' : 'text-text-primary' },
            { label: 'Warnings', value: summary.bySeverity.WARNING, tone: summary.bySeverity.WARNING > 0 ? 'text-warning' : 'text-text-primary' },
            { label: 'Resolved', value: summary.resolved, tone: 'text-success' },
          ].map(({ label, value, tone }) => (
            <div key={label} className="rounded-2xl bg-surface-raised border border-border-subtle p-4">
              <p className="text-xs text-text-secondary">{label}</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${tone}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(0); }}
            title={tab.description}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all border ${
              statusFilter === tab.value
                ? 'bg-gold text-white border-gold shadow-sm'
                : 'bg-surface-raised text-text-secondary border-border-subtle hover:text-text-primary'
            }`}
          >
            {tab.label}
            {tab.value === 'OPEN' && openCount > 0 && (
              <span className="ml-1.5 bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSkeleton />
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl bg-success-muted border border-success/30 p-8 text-center">
          <CheckCircle size={32} className="mx-auto text-success mb-2" />
          <p className="text-sm font-semibold text-success">No alerts here — you're all caught up!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const style = severityStyle[alert.severity] ?? severityStyle.INFO;
              const isResolved = alert.status === 'RESOLVED';
              const isActing = actingId === alert.id;
              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-4 ${style.bg} ${style.border} ${isResolved ? 'opacity-60' : ''}`}
                >
                  {/* Icon + message row */}
                  <div className="flex items-start gap-3">
                    {style.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-text-secondary">{style.label}</span>
                        {isResolved && (
                          <span className="text-xs bg-success-muted text-success px-2 py-0.5 rounded-full font-semibold border border-success/30">
                            ✓ Resolved
                          </span>
                        )}
                        {alert.status === 'ACKNOWLEDGED' && (
                          <span className="text-xs bg-surface-raised text-text-secondary px-2 py-0.5 rounded-full font-semibold border border-border-subtle">
                            Seen
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary leading-snug">{alert.message}</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(alert.createdAt).toLocaleString('en-GH', {
                          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  {/* Action buttons — full-width row below the message on mobile */}
                  {!isResolved && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-black/5">
                      {alert.status === 'OPEN' && (
                        <Button size="sm" variant="secondary" loading={isActing} onClick={() => handleAcknowledge(alert.id)} className="flex-1">
                          I&apos;ve seen it
                        </Button>
                      )}
                      <Button size="sm" loading={isActing} onClick={() => handleResolve(alert.id)} className="flex-1">
                        <CheckCircle size={13} /> Done
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={() => {}}
            hasMore={alerts.length === limit}
          />
        </>
      )}
    </div>
  );
}
