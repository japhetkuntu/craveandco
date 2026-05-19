'use client';

import { useState, useEffect, useCallback } from 'react';
import { get, post, patch } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Building2, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'PITCHED', label: 'Pitched' },
  { value: 'NEGOTIATING', label: 'Negotiating' },
  { value: 'SIGNED', label: 'Signed' },
  { value: 'LOST', label: 'Lost' },
];

const SOURCE_OPTIONS = [
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'WALK_IN_VISIT', label: 'Walk-in Visit' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EVENT', label: 'Event' },
  { value: 'EMAIL_OUTREACH', label: 'Email Outreach' },
  { value: 'OTHER', label: 'Other' },
];



interface Interaction {
  id: string;
  date: string;
  outcome?: string;
  notes?: string;
}

interface BusinessLead {
  id: string;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  industry?: string;
  status: string;
  estimatedValue?: string;
  notes?: string;
  followUpDate?: string;
  interactions: Interaction[];
  createdAt: string;
}

export default function SalesBusinessesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [statusFilter, setStatusFilter] = useState('');
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    industry: '',
    estimatedValue: '',
    notes: '',
    followUpDate: '',
  });

  // Update status form
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Interaction form
  const [interactionLeadId, setInteractionLeadId] = useState<string | null>(null);
  const [intForm, setIntForm] = useState({ date: today, outcome: '', notes: '' });
  const [intSaving, setIntSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ items: BusinessLead[]; total: number }>(
        API_PATHS.sales.leads(statusFilter || undefined, page, limit)
      );
      setLeads(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await post(API_PATHS.sales.createLead, {
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        industry: form.industry.trim() || undefined,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined,
        notes: form.notes.trim() || undefined,
        followUpDate: form.followUpDate || undefined,
      });
      setForm({ companyName: '', contactPerson: '', phone: '', email: '', industry: '', estimatedValue: '', notes: '', followUpDate: '' });
      setShowCreateForm(false);
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create lead.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await patch(API_PATHS.sales.updateLead(id), { status });
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddInteraction = async () => {
    if (!interactionLeadId) return;
    setIntSaving(true);
    try {
      await post(API_PATHS.sales.addInteraction, {
        businessLeadId: interactionLeadId,
        date: intForm.date,
        outcome: intForm.outcome.trim() || undefined,
        notes: intForm.notes.trim() || undefined,
      });
      setInteractionLeadId(null);
      setIntForm({ date: today, outcome: '', notes: '' });
      load();
    } finally {
      setIntSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && leads.length === 0) return <PageSkeleton />;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Business Pipeline</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track B2B leads and business opportunities</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 self-start">
          <Plus size={16} />
          New Lead
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              statusFilter === s.value
                ? 'bg-gold text-black border-transparent'
                : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
            style={statusFilter === s.value ? { backgroundColor: 'var(--color-gold)' } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Create form modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">New Business Lead</h2>
              <button onClick={() => setShowCreateForm(false)}>
                <X size={18} className="text-text-secondary" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Input placeholder="Company name *" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <Input placeholder="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              <Input placeholder="Estimated value (GHS)" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} />
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Follow-up date</label>
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-info"
                />
              </div>
              <div className="sm:col-span-2">
                <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create Lead'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add interaction modal */}
      {interactionLeadId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Log Interaction</h2>
              <button onClick={() => setInteractionLeadId(null)}>
                <X size={18} className="text-text-secondary" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Date</label>
                <input
                  type="date"
                  value={intForm.date}
                  onChange={(e) => setIntForm({ ...intForm, date: e.target.value })}
                  className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                />
              </div>
              <Input placeholder="Outcome (e.g. Interested, Requested proposal)" value={intForm.outcome} onChange={(e) => setIntForm({ ...intForm, outcome: e.target.value })} />
              <Input placeholder="Notes" value={intForm.notes} onChange={(e) => setIntForm({ ...intForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setInteractionLeadId(null)}>Cancel</Button>
              <Button onClick={handleAddInteraction} disabled={intSaving}>{intSaving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Leads list */}
      {leads.length > 0 ? (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-surface-raised border border-border-subtle rounded-xl overflow-hidden">
              {/* Header */}
              <div
                className="px-4 sm:px-5 py-4 flex items-center justify-between gap-2 cursor-pointer"
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Building2 size={16} className="text-warning flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{lead.companyName}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {lead.contactPerson && `${lead.contactPerson} · `}
                      {lead.industry ?? ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={lead.status} />
                  {expandedId === lead.id ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
                </div>
              </div>

              {/* Expanded */}
              {expandedId === lead.id && (
                <div className="border-t border-border-subtle px-4 sm:px-5 py-4 space-y-4">
                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {lead.phone && <p className="text-text-secondary">📞 {lead.phone}</p>}
                    {lead.email && <p className="text-text-secondary">✉️ {lead.email}</p>}
                    {lead.estimatedValue && (
                      <p className="text-text-secondary">💰 GHS {parseFloat(lead.estimatedValue).toLocaleString()}</p>
                    )}
                    {lead.followUpDate && (
                      <p className="text-text-secondary">
                        📅 Follow-up: {new Date(lead.followUpDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  {lead.notes && <p className="text-xs text-text-secondary italic">{lead.notes}</p>}

                  {/* Status update */}
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.filter((s) => s.value && s.value !== lead.status).map((s) => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusUpdate(lead.id, s.value)}
                        disabled={updatingId === lead.id}
                        className="text-xs px-3 py-1 rounded-full border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                      >
                        → {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Recent interactions */}
                  {lead.interactions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-2">Recent Interactions</p>
                      <ul className="space-y-1.5">
                        {lead.interactions.map((int) => (
                          <li key={int.id} className="text-xs text-text-secondary bg-surface-elevated rounded-lg px-3 py-2">
                            <span className="font-medium text-text-primary">
                              {int.date.slice(0, 10)}
                            </span>
                            {int.outcome && ` · ${int.outcome}`}
                            {int.notes && ` — ${int.notes}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => setInteractionLeadId(lead.id)}
                    className="text-xs"
                  >
                    + Log Interaction
                  </Button>
                </div>
              )}
            </div>
          ))}

          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            hasMore={page < totalPages}
          />
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12 text-text-secondary text-sm">
            No business leads found. Create your first lead above.
          </div>
        )
      )}
    </div>
  );
}
