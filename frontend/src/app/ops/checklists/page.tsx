'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { buildQueryString, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ClipboardList, CheckSquare, Square } from 'lucide-react';

interface ChecklistField {
  key: string;
  label: string;
  type: 'number' | 'text';
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  notes?: string;
  frequency?: string;
  hint?: string;
  fields?: ChecklistField[];
  fieldValues?: Record<string, string>;
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
    'Stock & Inventory': [
      { id: 'op-s1', label: 'Stock level check — flag items with < 3 orders left', frequency: 'Daily', hint: 'Items below threshold = stocking out', checked: false,
        fields: [{ key: 'flagged', label: 'Items flagged', type: 'number' }] },
      { id: 'op-s2', label: 'Log new stock received', frequency: 'Daily', hint: 'Quantity & supplier for each item', checked: false,
        fields: [{ key: 'details', label: 'Quantity & supplier', type: 'text' }] },
      { id: 'op-s3', label: 'Update running inventory count', frequency: 'Daily', checked: false },
    ],
    'Budget & Procurement': [
      { id: 'op-b1', label: 'Submit weekly foodstuffs budget', frequency: 'Sunday', hint: 'Plan & cost for the upcoming week', checked: false,
        fields: [{ key: 'total', label: 'Total (GHS)', type: 'number' }] },
      { id: 'op-b2', label: 'Log actual spend vs. budget', frequency: 'Daily', hint: 'Daily purchases against the Sunday plan', checked: false,
        fields: [{ key: 'budgeted', label: 'Budgeted (GHS)', type: 'number' }, { key: 'actual', label: 'Actual spend (GHS)', type: 'number' }] },
      { id: 'op-b3', label: 'Flag supplier issues or price changes', frequency: 'As needed', hint: 'Late delivery, wrong items, cost increases', checked: false,
        fields: [{ key: 'details', label: 'Issue description', type: 'text' }] },
    ],
    'Kitchen & Production': [
      { id: 'op-k1', label: 'Meals produced vs. meals sold', frequency: 'Daily', hint: 'Track daily to measure waste', checked: false,
        fields: [{ key: 'produced', label: 'Meals produced', type: 'number' }, { key: 'sold', label: 'Meals sold', type: 'number' }] },
      { id: 'op-k2', label: 'Food waste log', frequency: 'Daily', hint: 'What was discarded and why', checked: false,
        fields: [{ key: 'qty', label: 'Waste qty', type: 'number' }, { key: 'reason', label: 'Reason', type: 'text' }] },
      { id: 'op-k3', label: 'Equipment issues or downtime', frequency: 'As needed', hint: 'Note machine, issue & time lost', checked: false,
        fields: [{ key: 'details', label: 'Machine + issue + time lost', type: 'text' }] },
    ],
    'Quality, Team & Safety': [
      { id: 'op-q1', label: 'Customer complaints (food/service related)', frequency: 'Daily', hint: 'Log complaint & resolution action', checked: false,
        fields: [{ key: 'count', label: '# complaints', type: 'number' }, { key: 'details', label: 'Complaint & resolution', type: 'text' }] },
      { id: 'op-q2', label: 'Staff attendance & punctuality', frequency: 'Daily', hint: 'Note absences or late arrivals', checked: false,
        fields: [{ key: 'absent', label: 'Absent', type: 'number' }, { key: 'names', label: 'Names (optional)', type: 'text' }] },
      { id: 'op-q3', label: 'Kitchen cleanliness check done', frequency: 'Daily', checked: false },
      { id: 'op-q4', label: 'Incidents or near-misses', frequency: 'As needed', hint: 'Describe briefly in notes', checked: false,
        fields: [{ key: 'details', label: 'Description', type: 'text' }] },
    ],
    'Daily Reporting': [
      { id: 'op-d1', label: 'Send daily operations report to CEO', frequency: 'Daily', hint: 'Include all above sections', checked: false,
        fields: [{ key: 'timeSent', label: 'Time sent', type: 'text' }] },
    ],
  },
  GROWTH_LEAD: {
    'Channel & Customer Management': [
      { id: 'gl-c2', label: 'Add new customers to channel', frequency: 'As needed', checked: false,
        fields: [{ key: 'added', label: 'Customers added today', type: 'number' }] },
      { id: 'gl-c3', label: 'Engage customers on channel', frequency: 'Daily', hint: 'Post updates, respond to messages — short summary here', checked: false },
      { id: 'gl-c4', label: 'Get 10 new customers to join channel', frequency: 'Daily', checked: false,
        fields: [{ key: 'today', label: 'Count today', type: 'number' }] },
    ],
    'Customer Calls & Retention': [
      { id: 'gl-r1', label: 'Call each customer — thank & re-engage', frequency: 'Every 2 days', checked: false,
        fields: [{ key: 'reached', label: 'Reached', type: 'number' }, { key: 'notReached', label: 'Not reached', type: 'number' }] },
      { id: 'gl-r2', label: 'Log repeat vs. new customers', frequency: 'Daily', checked: false,
        fields: [{ key: 'repeat', label: 'Repeat customers', type: 'number' }, { key: 'newCustomers', label: 'New customers', type: 'number' }] },
      { id: 'gl-r3', label: 'Flag inactive customers (7+ days no order)', frequency: 'Daily', checked: false,
        fields: [{ key: 'flagged', label: 'Number flagged', type: 'number' }, { key: 'names', label: 'Names (optional)', type: 'text' }] },
      { id: 'gl-r4', label: 'Log customer referrals received', frequency: 'As needed', checked: false,
        fields: [{ key: 'count', label: 'Total referrals', type: 'number' }, { key: 'details', label: 'Referrer + new customer names', type: 'text' }] },
    ],
    'Catalog & Social Media': [
      { id: 'gl-s1', label: 'Update WhatsApp business catalog', frequency: 'As needed', checked: false,
        fields: [{ key: 'items', label: 'Items added', type: 'number' }, { key: 'details', label: 'Names / descriptions (optional)', type: 'text' }] },
      { id: 'gl-s2', label: 'WhatsApp posts', frequency: 'Daily', checked: false,
        fields: [{ key: 'posts', label: 'Posts today', type: 'number' }] },
      { id: 'gl-s3', label: 'Instagram posts', frequency: 'Daily', checked: false,
        fields: [{ key: 'posts', label: 'Posts today', type: 'number' }] },
      { id: 'gl-s4', label: 'TikTok posts', frequency: 'Daily', checked: false,
        fields: [{ key: 'posts', label: 'Posts today', type: 'number' }] },
      { id: 'gl-s5', label: 'Snapchat posts', frequency: 'Daily', checked: false,
        fields: [{ key: 'posts', label: 'Posts today', type: 'number' }] },
      { id: 'gl-s6', label: 'Follower count per platform', frequency: 'Weekly', checked: false,
        fields: [
          { key: 'whatsapp', label: 'WhatsApp', type: 'number' },
          { key: 'instagram', label: 'Instagram', type: 'number' },
          { key: 'tiktok', label: 'TikTok', type: 'number' },
          { key: 'snapchat', label: 'Snapchat', type: 'number' },
        ] },
    ],
  },
};

const getChecklistTemplateForRole = (role?: string) => (role ? ROLE_CHECKLISTS[role] : undefined) ?? DEFAULT_CHECKLISTS;

function itemHasEvidence(item: ChecklistItem): boolean {
  if (item.fields?.length) {
    return item.fields.filter((f) => f.type === 'number').some((f) => (item.fieldValues?.[f.key] ?? '').trim() !== '');
  }
  return !!(item.notes?.trim());
}

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

  const hasMissingNotes = user?.role === 'GROWTH_LEAD' && Object.values(checklists).some((items) =>
    items.some((item) => item.checked && !itemHasEvidence(item)),
  );

  const saveChecklist = async () => {
    if (!token || hasMissingNotes) return;
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

  const updateItemNotes = (listName: string, itemId: string, notes: string) => {
    setChecklists((prev) => ({
      ...prev,
      [listName]: prev[listName].map((item) =>
        item.id === itemId ? { ...item, notes } : item,
      ),
    }));
  };

  const updateItemField = (listName: string, itemId: string, key: string, value: string) => {
    setChecklists((prev) => ({
      ...prev,
      [listName]: prev[listName].map((item) =>
        item.id === itemId ? { ...item, fieldValues: { ...(item.fieldValues ?? {}), [key]: value } } : item,
      ),
    }));
  };

  const getProgress = (items: ChecklistItem[]) => {
    const checked = items.filter((i) => i.checked).length;
    return { checked, total: items.length, pct: Math.round((checked / items.length) * 100) };
  };

  const getChecklistMetrics = (lists: Record<string, ChecklistItem[]>) => {
    let checked = 0;
    let total = 0;
    let notes = 0;
    let missingNotes = 0;

    Object.values(lists).forEach((items) => {
      items.forEach((item) => {
        total += 1;
        if (item.checked) {
          checked += 1;
          if (itemHasEvidence(item)) {
            notes += 1;
          } else {
            missingNotes += 1;
          }
        }
      });
    });

    return {
      checked,
      total,
      notes,
      missingNotes,
      completion: total > 0 ? Math.round((checked / total) * 100) : 0,
    };
  };

  const getHistoryEvidenceMetrics = (lists: Record<string, any>) => {
    let checked = 0;
    let notes = 0;

    Object.values(lists).forEach((items: any) => {
      if (!Array.isArray(items)) return;
      items.forEach((item: any) => {
        if (item?.checked) {
          checked += 1;
          const hasEvidence = item.fields?.length
            ? item.fields.filter((f: any) => f.type === 'number').some((f: any) => (item.fieldValues?.[f.key] ?? '').trim() !== '')
            : !!(item.notes?.trim());
          if (hasEvidence) notes += 1;
        }
      });
    });

    return { checked, notes, missingNotes: checked - notes };
  };

  const checklistMetrics = getChecklistMetrics(checklists);

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
          <div className="flex flex-col gap-2 sm:items-end">
            {hasMissingNotes && (
              <div className="rounded-2xl border border-warning/30 bg-warning-muted px-4 py-3 text-sm text-warning">
                Please add a short note for every checked Growth Lead item before saving.
              </div>
            )}
            <Button onClick={saveChecklist} loading={saving} variant="primary" disabled={hasMissingNotes}>
              Save checklist
            </Button>
          </div>
        )}
      </div>

      {user?.role === 'GROWTH_LEAD' && (
        <div className="rounded-3xl border border-border-default bg-surface-raised px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">What we measure</p>
              <p className="text-sm text-text-secondary mt-1">Simple growth checklist metrics to show real work.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
              <div className="rounded-2xl bg-surface-base px-4 py-3 text-center">
                <p className="text-xs text-text-tertiary">Checked items</p>
                <p className="text-xl font-semibold text-text-primary">{checklistMetrics.checked}</p>
              </div>
              <div className="rounded-2xl bg-surface-base px-4 py-3 text-center">
                <p className="text-xs text-text-tertiary">With notes</p>
                <p className="text-xl font-semibold text-text-primary">{checklistMetrics.notes}</p>
              </div>
              <div className="rounded-2xl bg-surface-base px-4 py-3 text-center">
                <p className="text-xs text-text-tertiary">Missing notes</p>
                <p className="text-xl font-semibold text-warning">{checklistMetrics.missingNotes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <th className="px-4 py-3 font-medium">Notes</th>
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
                          <td className="px-4 py-3">{(() => {
                            const metrics = getHistoryEvidenceMetrics(entry.lists || {});
                            return `${metrics.notes}/${metrics.checked}`;
                          })()}</td>
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
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-surface-base px-3 py-1 text-xs font-semibold text-text-secondary">
                    Completion {selectedRecord.completion}%
                  </span>
                  {(() => {
                    const metrics = getHistoryEvidenceMetrics(selectedRecord.lists || {});
                    return (
                      <span className="rounded-full bg-surface-base px-3 py-1 text-xs font-semibold text-text-secondary">
                        Evidence {metrics.notes}/{metrics.checked}
                      </span>
                    );
                  })()}
                </div>
              </div>
              {Object.entries(selectedRecord.lists || {}).map(([section, items]: [string, any]) => (
                <div key={section} className="space-y-2">
                  <h3 className="text-sm font-semibold text-text-primary">{section}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Array.isArray(items) ? items.map((item: any) => (
                      <div key={item.id || item.label} className="rounded-2xl border border-border-subtle bg-surface-base p-3">
                        <p className="font-medium text-text-primary">{item.label}</p>
                        <p className="text-sm text-text-secondary">{item.checked ? 'Completed' : 'Pending'}</p>
                        {item.fields?.length ? (
                          <div className="mt-2 space-y-0.5">
                            {item.fields.filter((f: any) => (item.fieldValues?.[f.key] ?? '').trim() !== '').map((f: any) => (
                              <p key={f.key} className="text-xs text-text-tertiary">
                                {f.label}: <span className="font-semibold text-text-primary">{item.fieldValues?.[f.key]}</span>
                              </p>
                            ))}
                          </div>
                        ) : item.notes ? (
                          <p className="mt-2 text-sm text-text-tertiary">Notes: {item.notes}</p>
                        ) : null}
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
                <div key={item.id} className="rounded-2xl border border-border-subtle bg-surface-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleItem(name, item.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-base transition-colors text-left"
                  >
                    {item.checked ? (
                      <CheckSquare size={20} className="text-success shrink-0" />
                    ) : (
                      <Square size={20} className="text-text-tertiary shrink-0" />
                    )}
                    <span className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                      <span className={`text-sm ${item.checked ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                        {item.label}
                      </span>
                      {item.frequency && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-base border border-border-subtle text-text-tertiary shrink-0">
                          {item.frequency}
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="px-6 pb-3">
                    {item.fields?.length ? (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {item.fields.map((field) => (
                          <label key={field.key} className="flex flex-col gap-1">
                            <span className="text-xs text-text-tertiary">{field.label}</span>
                            <input
                              type={field.type === 'number' ? 'number' : 'text'}
                              min={field.type === 'number' ? 0 : undefined}
                              value={item.fieldValues?.[field.key] ?? ''}
                              onChange={(e) => updateItemField(name, item.id, field.key, e.target.value)}
                              placeholder={field.type === 'number' ? '0' : 'Optional'}
                              className="rounded-2xl border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={item.notes ?? ''}
                        onChange={(e) => updateItemNotes(name, item.id, e.target.value)}
                        placeholder={item.hint ?? 'Add evidence / summary'}
                        className="mt-2 w-full min-h-[64px] rounded-2xl border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                      />
                    )}
                    {user?.role === 'GROWTH_LEAD' && item.checked && !itemHasEvidence(item) && (
                      <p className="mt-1 text-xs text-warning">Fill in at least one number to confirm this was done.</p>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
