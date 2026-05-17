'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch, del } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Clock, UserCheck, UserX, Plus, UserMinus, Trash2, Pencil } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface Shift {
  id: string;
  slot: string;
  date: string;
  user: { name: string };
  clockIn?: string | null;
  clockOut?: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function OwnerStaffPage() {
  const { token } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATIONS_MANAGER',
  });

  // Edit state
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [editError, setEditError] = useState('');

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now);
    weekStart.setDate(diff);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    try {
      const [s, staffList] = await Promise.all([
        get(`/api/v1/shifts?weekStart=${weekStartStr}`, token),
        get(`/api/v1/owner/staff${buildQueryString({ page, limit })}`, token),
      ]);
      setShifts(s);
      setStaff(staffList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [token, page, limit]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError('');
    setSaving(true);

    try {
      await post('/api/v1/owner/staff', newStaff, token);
      setNewStaff({ name: '', email: '', password: '', role: 'OPERATIONS_MANAGER' });
      setShowCreateModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!token) return;
    try {
      await patch(`/api/v1/owner/staff/${id}`, { active: false }, token);
      setStaff((prev) => prev.map((member) => (member.id === id ? { ...member, active: false } : member)));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (member: StaffMember) => {
    setEditingMember(member);
    setEditForm({ name: member.name, email: member.email, phone: member.phone ?? '', role: member.role });
    setEditError('');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingMember) return;
    setSaving(true);
    setEditError('');
    try {
      const updated = await patch(`/api/v1/owner/staff/${editingMember.id}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || undefined,
        role: editForm.role,
      }, token);
      setStaff((prev) => prev.map((m) => (m.id === editingMember.id ? updated : m)));
      setEditingMember(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await del(`/api/v1/owner/staff/${id}`, token);
      setStaff((prev) => prev.filter((member) => member.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter((s) => s.date === today);
  const clockedIn = todayShifts.filter((s) => s.clockIn && !s.clockOut);
  const clockedOut = todayShifts.filter((s) => s.clockOut);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Users className="text-[var(--color-gold)]" /> Staff Team
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Create and manage your team</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Add Staff
        </Button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Users size={18} />, label: 'Total Staff', value: staff.length, tone: undefined },
          { icon: <UserCheck size={18} />, label: 'Active', value: staff.filter(m => m.active).length, tone: 'green' as const },
          { icon: <UserX size={18} />, label: 'Inactive', value: staff.filter(m => !m.active).length, tone: staff.some(m => !m.active) ? 'yellow' as const : undefined },
          { icon: <Clock size={18} />, label: 'On Duty Now', value: clockedIn.length, tone: clockedIn.length > 0 ? 'green' as const : undefined },
        ].map(({ icon, label, value, tone }) => {
          const bg = tone === 'green' ? 'bg-success-muted border-success/30' : tone === 'yellow' ? 'bg-warning-muted border-warning/30' : 'bg-surface-raised border-border-subtle';
          const tv = tone === 'green' ? 'text-success' : tone === 'yellow' ? 'text-warning' : 'text-text-primary';
          return (
            <div key={label} className={`rounded-2xl border p-4 flex flex-col gap-2 ${bg}`}>
              <div className={`flex items-center gap-2 text-sm font-semibold ${tv}`}>{icon}<span>{label}</span></div>
              <p className={`text-3xl font-bold font-mono ${tv}`}>{value}</p>
            </div>
          );
        })}
      </div>

      {/* Shift summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Shifts", value: todayShifts.length },
          { label: 'Clocked In', value: clockedIn.length },
          { label: 'Clocked Out', value: clockedOut.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border-subtle bg-surface-raised p-3 text-center">
            <p className="text-xs text-text-tertiary">{label}</p>
            <p className="text-2xl font-bold font-mono text-text-primary mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Staff list */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        {staff.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Users size={32} className="text-text-tertiary opacity-50" />
            <p className="text-sm font-semibold text-text-secondary">No staff members yet</p>
            <p className="text-xs text-text-tertiary">Add your first team member to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {staff.map((member) => (
              <div
                key={member.id}
                className={`p-4 transition-colors ${member.active ? '' : 'opacity-60'}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-primary text-base">{member.name}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${member.active ? 'bg-success-muted text-success' : 'bg-surface-elevated text-text-tertiary'}`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="rounded-full bg-warning-muted px-2.5 py-0.5 text-xs font-semibold text-[var(--color-gold)]">
                        {member.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{member.email}</p>
                    {member.phone && <p className="text-xs text-text-tertiary mt-0.5">{member.phone}</p>}
                    <p className="text-xs text-text-tertiary mt-0.5">Joined {new Date(member.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(member)}
                      disabled={member.role === 'OWNER'}
                    >
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeactivate(member.id)}
                      disabled={!member.active || member.role === 'OWNER'}
                    >
                      <UserMinus size={14} /> Deactivate
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                      disabled={member.role === 'OWNER'}
                    >
                      <Trash2 size={14} /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 pb-4 pt-2">
          <PaginationControls
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => { setLimit(value); setPage(0); }}
            hasMore={staff.length === limit}
          />
        </div>
      </div>

      {/* Edit Staff Modal */}
      {!!editingMember && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Edit Staff Member</h2>
                <p className="text-sm text-text-secondary mt-1">Update staff details below.</p>
              </div>
              <Button variant="secondary" onClick={() => { setEditingMember(null); setEditError(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {editError && <div className="mb-4 rounded-2xl bg-error-muted p-3 text-sm text-error">{editError}</div>}
              <form id="edit-staff-form" onSubmit={handleEditSave} className="space-y-4">
                <Input
                  label="Full Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone (optional)"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. 0244000000"
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                    <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    <option value="GROWTH_LEAD">Growth Lead</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setEditingMember(null); setEditError(''); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="edit-staff-form" loading={saving}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-end sm:items-center justify-center overflow-hidden bg-black/40 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl max-h-[88dvh] sm:max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Add Staff Member</h2>
                <p className="text-sm text-text-secondary mt-1">Create a new account for your team.</p>
              </div>
              <Button variant="secondary" onClick={() => { setShowCreateModal(false); setError(''); }}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {error && <div className="mb-4 rounded-2xl bg-error-muted p-3 text-sm text-error">{error}</div>}
              <form id="new-staff-form" onSubmit={handleCreateStaff} className="space-y-4">
                <Input
                  label="Full Name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  required
                  placeholder="e.g. Ama Owusu"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  required
                  placeholder="e.g. ama@crave.com"
                />
                <Input
                  label="Password"
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  required
                  placeholder="At least 6 characters"
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-secondary">Role</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                    <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    <option value="GROWTH_LEAD">Growth Lead</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowCreateModal(false); setError(''); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit" form="new-staff-form" loading={saving}>Add Staff Member</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
