'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ClipboardList, CheckSquare, Square } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECKLISTS: Record<string, ChecklistItem[]> = {
  'Opening': [
    { id: 'o1', label: 'Turn on all equipment', checked: false },
    { id: 'o2', label: 'Check ingredient freshness', checked: false },
    { id: 'o3', label: 'Verify cash float', checked: false },
    { id: 'o4', label: 'Clean all surfaces', checked: false },
    { id: 'o5', label: 'Staff briefing completed', checked: false },
    { id: 'o6', label: 'Menu boards updated', checked: false },
    { id: 'o7', label: 'Check delivery schedule', checked: false },
  ],
  'Closing': [
    { id: 'c1', label: 'All equipment turned off', checked: false },
    { id: 'c2', label: 'Food stored properly', checked: false },
    { id: 'c3', label: 'Cash reconciled', checked: false },
    { id: 'c4', label: 'Floors mopped', checked: false },
    { id: 'c5', label: 'Bins emptied', checked: false },
    { id: 'c6', label: 'Doors and windows locked', checked: false },
    { id: 'c7', label: 'Handover notes posted', checked: false },
  ],
  'Hygiene': [
    { id: 'h1', label: 'Handwashing stations stocked', checked: false },
    { id: 'h2', label: 'Temperature logs recorded', checked: false },
    { id: 'h3', label: 'Sanitizer available at all stations', checked: false },
    { id: 'h4', label: 'Food handling gloves available', checked: false },
    { id: 'h5', label: 'Pest control check', checked: false },
  ],
};

const ROLE_CHECKLISTS: Record<string, Record<string, ChecklistItem[]>> = {
  KITCHEN_STAFF: DEFAULT_CHECKLISTS,
  OPERATIONS_MANAGER: {
    'Opening': [
      { id: 'o1', label: 'Confirm staff assignments', checked: false },
      { id: 'o2', label: 'Review inventory shortages', checked: false },
      { id: 'o3', label: 'Check service readiness', checked: false },
      { id: 'o4', label: 'Verify cleaning schedule', checked: false },
    ],
    'Closing': [
      { id: 'c1', label: 'Confirm all stations closed', checked: false },
      { id: 'c2', label: 'Review day close tasks', checked: false },
      { id: 'c3', label: 'Confirm urgent issues logged', checked: false },
      { id: 'c4', label: 'Check staff handover notes', checked: false },
    ],
    'Safety': [
      { id: 's1', label: 'Verify fire exits unlocked', checked: false },
      { id: 's2', label: 'Inspect first aid kit', checked: false },
      { id: 's3', label: 'Check sanitizer dispensers', checked: false },
    ],
  },
  GROWTH_LEAD: {
    'Marketing': [
      { id: 'm1', label: 'Review campaign performance', checked: false },
      { id: 'm2', label: 'Verify promotions are active', checked: false },
      { id: 'm3', label: 'Confirm loyalty offers are live', checked: false },
    ],
    'Feedback': [
      { id: 'm4', label: 'Check customer feedback tickets', checked: false },
      { id: 'm5', label: 'Review social interactions', checked: false },
    ],
  },
};

const getChecklistTemplateForRole = (role?: string) => (role ? ROLE_CHECKLISTS[role] : undefined) ?? DEFAULT_CHECKLISTS;

export default function OpsChecklistsPage() {
  const { token, user } = useAuth();
  const [checklists, setChecklists] = useState(DEFAULT_CHECKLISTS);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<Array<any>>([]);
  const [dailySummaries, setDailySummaries] = useState<Array<any>>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [historyFrom, setHistoryFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date.toISOString().split('T')[0];
  });
  const [historyTo, setHistoryTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    setChecklists(getChecklistTemplateForRole(user.role));
  }, [user]);

  useEffect(() => {
    if (!token || !user || user.role === 'OWNER') return;
    get(`/api/v1/ops/checklists?date=${today}`, token)
      .then((result) => {
        if (result?.lists) {
          setChecklists(result.lists);
        }
      })
      .catch(console.error);
  }, [token, today, user]);

  useEffect(() => {
    if (!token || !user) return;
    setHistoryLoading(true);
    const params: Record<string, string> = {
      from: historyFrom,
      to: historyTo,
    };
    if (user.role === 'KITCHEN_STAFF') {
      params.userId = user.userId;
    }
    if (userRoleFilter !== 'ALL') {
      params.role = userRoleFilter;
    }

    get(`/api/v1/ops/checklists/history${buildQueryString(params)}`, token)
      .then((result) => {
        setHistory(result?.history || []);
        setDailySummaries(result?.dailySummaries || []);
        setSelectedRecord(result?.history?.[0] || null);
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [token, user, historyFrom, historyTo, userRoleFilter]);

  const filteredHistory = history;

  useEffect(() => {
    if (!selectedRecord || filteredHistory.length === 0) return;
    if (!filteredHistory.some((entry) => entry.id === selectedRecord.id)) {
      setSelectedRecord(filteredHistory[0] || null);
    }
  }, [filteredHistory, selectedRecord]);

  const saveChecklist = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await post('/api/v1/ops/checklists', { date: today, lists: checklists }, token);
      setLastSaved(new Date().toLocaleTimeString('en-GH'));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (listName: string, itemId: string) => {
    setChecklists((prev) => ({
      ...prev,
      [listName]: prev[listName].map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    }));
  };

  const getProgress = (items: ChecklistItem[]) => {
    const checked = items.filter((i) => i.checked).length;
    return { checked, total: items.length, pct: Math.round((checked / items.length) * 100) };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="text-gold" /> Daily Checklists
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {lastSaved && user?.role !== 'OWNER' && (
            <p className="text-xs text-text-secondary mt-1">Last saved at {lastSaved}</p>
          )}
          {user?.role === 'OWNER' && (
            <div className="mt-3 rounded-3xl border border-border-default bg-surface-base px-4 py-3 text-sm text-text-secondary">
              Owner view only. Review submissions below and click a record to inspect the completed checklist.
            </div>
          )}
        </div>
        {user?.role !== 'OWNER' && (
          <Button onClick={saveChecklist} loading={saving} variant="primary">
            Save checklist
          </Button>
        )}
      </div>

      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Checklist History</p>
              <p className="text-sm text-text-secondary mt-1">
                Review daily completion rates and recent checklist submissions for your branch.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 w-full sm:w-auto">
              <label className="text-sm text-text-secondary">
                From
                <input
                  type="date"
                  value={historyFrom}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-base text-text-primary outline-none"
                />
              </label>
              <label className="text-sm text-text-secondary">
                To
                <input
                  type="date"
                  value={historyTo}
                  onChange={(e) => setHistoryTo(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-base text-text-primary outline-none"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySummaries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Completion']} />
                  <Line type="monotone" dataKey="averageCompletion" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {historyLoading ? (
              <div className="text-center text-sm text-text-secondary">Loading history...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center text-sm text-text-secondary">No checklist history found for this period.</div>
            ) : (
              <>
                {(user?.role === 'OWNER' || user?.role === 'OPERATIONS_MANAGER') && (
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-text-secondary">Filter history by role</div>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="rounded-2xl border border-border-default bg-surface-input px-3 py-2 text-base text-text-primary outline-none"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="KITCHEN_STAFF">Kitchen Staff</option>
                      <option value="OPERATIONS_MANAGER">Operations Manager</option>
                      <option value="GROWTH_LEAD">Growth Lead</option>
                    </select>
                  </div>
                )}
                <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b text-left text-text-secondary">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Team Member</th>
                      <th className="px-4 py-3 font-medium">Completion</th>
                      <th className="px-4 py-3 font-medium">Items</th>
                      <th className="px-4 py-3 font-medium">Saved At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((entry) => {
                      const isSelected = selectedRecord?.id === entry.id;
                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setSelectedRecord(entry)}
                          className={`border-b last:border-0 hover:bg-gold-muted/30 transition-colors cursor-pointer ${isSelected ? 'bg-gold-muted/20' : ''}`}
                        >
                          <td className="px-4 py-3 text-text-primary">{entry.date}</td>
                          <td className="px-4 py-3 text-text-secondary">{entry.user?.name || 'Unknown'}</td>
                          <td className="px-4 py-3 font-semibold">{entry.completion}%</td>
                          <td className="px-4 py-3">{entry.completedItems}/{entry.totalItems}</td>
                          <td className="px-4 py-3 text-text-tertiary">{formatDate(entry.savedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Checklist Details</p>
        </div>
        <div className="p-4">
          {selectedRecord ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Submitted by {selectedRecord.user?.name || 'Unknown'} ({selectedRecord.user?.role || 'Unknown role'})</p>
                  <p className="text-sm text-text-secondary">Date: {selectedRecord.date}</p>
                </div>
                <span className="rounded-full bg-surface-base px-3 py-1 text-xs font-semibold text-text-secondary">
                  Completion {selectedRecord.completion}%
                </span>
              </div>
              {Object.entries(selectedRecord.lists || {}).map(([section, items]: [string, any]) => (
                <div key={section} className="space-y-2">
                  <h3 className="text-sm font-semibold text-text-primary">{section}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Array.isArray(items) ? items.map((item: any) => (
                      <div key={item.id || item.label} className="rounded-2xl border border-border-subtle bg-surface-base p-3">
                        <p className="font-medium text-text-primary">{item.label}</p>
                        <p className="text-sm text-text-secondary">{item.checked ? 'Completed' : 'Pending'}</p>
                      </div>
                    )) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Select a checklist record above to see the submitted details.</p>
          )}
        </div>
      </div>

      {user?.role !== 'OWNER' && Object.entries(checklists).map(([name, items]) => {
        const prog = getProgress(items);
        return (
          <div key={name} className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">{name}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  prog.pct === 100
                    ? 'bg-success-muted text-success'
                    : 'bg-gold-muted text-gold'
                }`}>
                  {prog.checked}/{prog.total}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-surface-elevated rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${prog.pct === 100 ? 'bg-success-muted0' : 'bg-gold'}`}
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(name, item.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-base transition-colors text-left"
                  >
                    {item.checked ? (
                      <CheckSquare size={20} className="text-success shrink-0" />
                    ) : (
                      <Square size={20} className="text-text-tertiary shrink-0" />
                    )}
                    <span className={`text-sm ${item.checked ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
