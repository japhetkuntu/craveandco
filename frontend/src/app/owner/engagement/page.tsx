'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  HeartHandshake,
  TrendingUp,
  CheckCircle2,
  ShoppingBag,
  Users,
  BarChart3,
  Phone,
  MessageSquare,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  CALL:      <Phone size={14} />,
  WHATSAPP:  <MessageSquare size={14} />,
  SMS:       <MessageSquare size={14} />,
  IN_PERSON: <Users size={14} />,
  EMAIL:     <Mail size={14} />,
  UNKNOWN:   <HeartHandshake size={14} />,
};

interface DailySummary {
  date: string;
  totalCustomers: number;
  totalLogged: number;
  totalNotLogged: number;
  totalEngaged: number;
  totalNotEngaged: number;
  totalConverted: number;
  engagementRate: number;
  conversionRate: number;
  coverageRate: number;
}

interface EngagementSummary {
  totalCustomers: number;
  totalUniqueLogged: number;
  totalNotLogged: number;
  totalLogged: number;
  totalEngaged: number;
  totalConverted: number;
  engagementRate: number;
  conversionRate: number;
}

interface DayTrend {
  date: string;
  total: number;
  engaged: number;
  converted: number;
}

interface TopEngager {
  id: string;
  name: string;
  engaged: number;
  converted: number;
}

interface ChannelBreakdown {
  channel: string;
  count: number;
}

interface RecentActivity {
  id: string;
  customer: { id: string; name: string; phone?: string };
  engagedBy: { id: string; name: string };
  date: string;
  engaged: boolean;
  engagedAt?: string;
  channel?: string;
  notes?: string;
  orderedToday: boolean;
}

interface Analytics {
  summary: EngagementSummary;
  dailyTrend: DayTrend[];
  topEngagers: TopEngager[];
  channelBreakdown: ChannelBreakdown[];
  recentActivity: RecentActivity[];
}

function offsetDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

const RANGE_OPTIONS = [
  { label: 'Today',     fromBack: 0, toBack: 0 },
  { label: 'Yesterday', fromBack: 1, toBack: 1 },
  { label: '7 days',   fromBack: 6, toBack: 0 },
  { label: '14 days',  fromBack: 13, toBack: 0 },
  { label: '30 days',  fromBack: 29, toBack: 0 },
];

export default function OwnerEngagementPage() {
  const { user, loading: authLoading } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  // Daily summary state
  const [dailyDate, setDailyDate] = useState(todayStr);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);

  // Range analytics state
  const [rangeIdx, setRangeIdx] = useState(2); // default: 7 days
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendPage, setTrendPage] = useState(0);
  const TREND_PAGE_SIZE = 7;

  const fetchDailySummary = useCallback(async () => {
    setDailyLoading(true);
    try {
      const data = await get<DailySummary>(API_PATHS.engagement.dailySummary(dailyDate));
      setDailySummary(data);
    } catch {
      // silently ignore — daily section just stays blank
    } finally {
      setDailyLoading(false);
    }
  }, [dailyDate]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    const opt = RANGE_OPTIONS[rangeIdx];
    const from = offsetDate(opt.fromBack);
    const to = offsetDate(opt.toBack);
    try {
      const data = await get<Analytics>(API_PATHS.engagement.analytics(from, to));
      setAnalytics(data);
      setTrendPage(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [rangeIdx]);

  useEffect(() => {
    if (!authLoading && user) fetchDailySummary();
  }, [authLoading, user, fetchDailySummary]);

  useEffect(() => {
    if (!authLoading && user) fetchAnalytics();
  }, [authLoading, user, fetchAnalytics]);

  if (authLoading || loading) return <PageSkeleton />;
  if (error) return <div className="text-error text-center py-12">{error}</div>;
  if (!analytics) return null;

  const { summary, dailyTrend, topEngagers, channelBreakdown, recentActivity } = analytics;

  // Paginate trend chart
  const trendStart = trendPage * TREND_PAGE_SIZE;
  const trendSlice = dailyTrend.slice(trendStart, trendStart + TREND_PAGE_SIZE);
  const maxTrendVal = Math.max(...trendSlice.map((d) => d.total), 1);

  const totalChannelCount = channelBreakdown.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HeartHandshake className="text-[var(--color-gold)]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Engagement Insights</h1>
            <p className="text-sm text-text-secondary">Track how the growth team engages customers</p>
          </div>
        </div>
        {/* Range picker */}
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((opt, idx) => (
            <button
              key={opt.label}
              onClick={() => setRangeIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                rangeIdx === idx
                  ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]'
                  : 'bg-surface-raised text-text-secondary border-border-subtle hover:border-text-tertiary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Daily snapshot ── */}
      <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Users size={18} className="text-[var(--color-gold)]" />
            Daily Snapshot
          </h2>
          <input
            type="date"
            value={dailyDate}
            max={todayStr}
            onChange={(e) => setDailyDate(e.target.value)}
            className="border border-border-subtle rounded-lg px-3 py-1.5 text-sm bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          />
        </div>

        {dailyLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-surface-elevated rounded-xl" />
            ))}
          </div>
        ) : dailySummary ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              {
                label: 'Total Customers',
                value: dailySummary.totalCustomers,
                sub: 'in system',
                border: 'border-border-subtle',
                text: 'text-text-primary',
              },
              {
                label: 'Logged',
                value: dailySummary.totalLogged,
                sub: `${dailySummary.coverageRate}% coverage`,
                border: 'border-info',
                text: 'text-info',
              },
              {
                label: 'Not Logged',
                value: dailySummary.totalNotLogged,
                sub: 'no entry yet',
                border: 'border-error',
                text: 'text-error',
              },
              {
                label: 'Engaged',
                value: dailySummary.totalEngaged,
                sub: `${dailySummary.engagementRate}% of logged`,
                border: 'border-success',
                text: 'text-success',
              },
              {
                label: 'Converted',
                value: dailySummary.totalConverted,
                sub: `${dailySummary.conversionRate}% of engaged`,
                border: 'border-[var(--color-gold)]',
                text: 'text-[var(--color-gold)]',
              },
            ].map((tile) => (
              <div
                key={tile.label}
                className={`bg-surface-elevated border ${tile.border} rounded-xl p-4`}
              >
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">{tile.label}</p>
                <p className={`text-2xl font-bold ${tile.text}`}>{tile.value}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{tile.sub}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Coverage row: logged vs not logged (range) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-text-primary">{summary.totalCustomers}</p>
          <p className="text-xs text-text-tertiary mt-0.5">in the system</p>
        </div>
        <div className="bg-surface-raised border border-success rounded-xl p-4">
          <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Logged This Period</p>
          <p className="text-2xl font-bold text-success">{summary.totalUniqueLogged}</p>
          <p className="text-xs text-text-tertiary mt-0.5">
            {summary.totalCustomers > 0
              ? `${Math.round((summary.totalUniqueLogged / summary.totalCustomers) * 100)}% coverage`
              : 'no customers yet'}
          </p>
        </div>
        <div className="bg-surface-raised border border-error rounded-xl p-4">
          <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Not Yet Logged</p>
          <p className="text-2xl font-bold text-error">{summary.totalNotLogged}</p>
          <p className="text-xs text-text-tertiary mt-0.5">no activity this period</p>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Logged', value: summary.totalLogged, icon: <Users size={18} />, color: 'text-text-primary' },
          { label: 'Engaged', value: summary.totalEngaged, icon: <HeartHandshake size={18} />, color: 'text-success' },
          { label: 'Converted', value: summary.totalConverted, icon: <ShoppingBag size={18} />, color: 'text-[var(--color-gold)]' },
          { label: 'Engagement Rate', value: `${summary.engagementRate}%`, icon: <TrendingUp size={18} />, color: 'text-info' },
          { label: 'Conversion Rate', value: `${summary.conversionRate}%`, icon: <CheckCircle2 size={18} />, color: 'text-success' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface-raised border border-border-subtle rounded-xl p-4">
            <div className={`mb-2 ${kpi.color}`}>{kpi.icon}</div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily trend chart */}
        <div className="lg:col-span-2 bg-surface-raised border border-border-subtle rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <BarChart3 size={18} className="text-[var(--color-gold)]" />
              Daily Trend
            </h2>
            <div className="flex items-center gap-2">
              <button
                disabled={trendPage === 0}
                onClick={() => setTrendPage((p) => p - 1)}
                className="p-1 rounded text-text-tertiary hover:text-text-primary disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-text-tertiary">
                {trendStart + 1}–{Math.min(trendStart + TREND_PAGE_SIZE, dailyTrend.length)} of {dailyTrend.length}
              </span>
              <button
                disabled={trendStart + TREND_PAGE_SIZE >= dailyTrend.length}
                onClick={() => setTrendPage((p) => p + 1)}
                className="p-1 rounded text-text-tertiary hover:text-text-primary disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {trendSlice.length === 0 ? (
            <p className="text-center text-text-tertiary py-8 text-sm">No data for this period</p>
          ) : (
            <div className="space-y-2">
              {trendSlice.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-text-tertiary w-24 shrink-0">
                    {new Date(day.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </span>
                  <div className="flex-1 flex gap-1 items-center">
                    {/* Logged bar */}
                    <div className="flex-1 bg-surface-elevated rounded-full h-4 relative overflow-hidden">
                      <div
                        className="h-full bg-border-subtle rounded-full"
                        style={{ width: `${(day.total / maxTrendVal) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 left-0 h-full bg-info rounded-full"
                        style={{ width: `${(day.engaged / maxTrendVal) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 left-0 h-full bg-[var(--color-gold)] rounded-full"
                        style={{ width: `${(day.converted / maxTrendVal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-tertiary w-24 shrink-0 text-right">
                      {day.engaged}/{day.total} engaged · {day.converted} ordered
                    </span>
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex gap-4 pt-1 flex-wrap">
                {[
                  { color: 'bg-border-subtle', label: 'Logged' },
                  { color: 'bg-info', label: 'Engaged' },
                  { color: 'bg-[var(--color-gold)]', label: 'Ordered' },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <span className={`w-3 h-3 rounded-full ${l.color}`} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Channel breakdown */}
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--color-gold)]" />
            Channel Breakdown
          </h2>
          {channelBreakdown.length === 0 ? (
            <p className="text-center text-text-tertiary py-8 text-sm">No engagements logged yet</p>
          ) : (
            <div className="space-y-3">
              {channelBreakdown
                .sort((a, b) => b.count - a.count)
                .map((ch) => (
                  <div key={ch.channel}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                        {CHANNEL_ICONS[ch.channel] ?? CHANNEL_ICONS.UNKNOWN}
                        {ch.channel.charAt(0) + ch.channel.slice(1).toLowerCase().replace('_', '-')}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">{ch.count}</span>
                    </div>
                    <div className="w-full bg-surface-elevated rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[var(--color-gold)]"
                        style={{ width: `${(ch.count / totalChannelCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Engagers */}
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--color-gold)]" />
            Top Engagers
          </h2>
          {topEngagers.length === 0 ? (
            <p className="text-center text-text-tertiary py-8 text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {topEngagers.map((eng, idx) => (
                <div key={eng.id} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-text-tertiary text-right">{idx + 1}.</span>
                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-sm font-semibold text-text-secondary shrink-0">
                    {eng.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{eng.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {eng.engaged} engaged · {eng.converted} converted
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-success">
                      {eng.engaged > 0 ? Math.round((eng.converted / eng.engaged) * 100) : 0}%
                    </p>
                    <p className="text-xs text-text-tertiary">conversion</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[var(--color-gold)]" />
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-center text-text-tertiary py-8 text-sm">No activity logged</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 py-2 border-b border-border-subtle last:border-0"
                >
                  <div className={`mt-0.5 shrink-0 ${act.engaged ? 'text-success' : 'text-text-tertiary'}`}>
                    {act.engaged ? <CheckCircle2 size={16} /> : <HeartHandshake size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">{act.customer.name}</p>
                    <p className="text-xs text-text-tertiary">
                      by {act.engagedBy.name}
                      {act.channel ? ` via ${act.channel.charAt(0) + act.channel.slice(1).toLowerCase()}` : ''}
                      {act.engagedAt
                        ? ` at ${new Date(act.engagedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : ''}
                    </p>
                    {act.notes && (
                      <p className="text-xs text-text-secondary mt-0.5 italic truncate">"{act.notes}"</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {act.orderedToday && (
                      <span className="flex items-center gap-1 text-xs text-[var(--color-gold)]">
                        <ShoppingBag size={12} /> Ordered
                      </span>
                    )}
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {new Date(act.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
