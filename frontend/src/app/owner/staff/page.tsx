'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post, patch, del } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination';
import { KPICard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Users, Clock, UserCheck, UserX, Plus, UserMinus, Trash2 } from 'lucide-react';
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

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="text-gold" /> Staff Team
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Create and manage your team from the owner portal.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Staff" value={staff.length} icon={<Users size={20} />} />
        <KPICard title="Active" value={staff.filter((member) => member.active).length} icon={<UserCheck size={20} />} severity="healthy" />
        <KPICard title="Inactive" value={staff.filter((member) => !member.active).length} icon={<UserX size={20} />} severity={staff.some((member) => !member.active) ? 'warning' : 'healthy'} />
        <KPICard title="On Duty" value={clockedIn.length} icon={<Clock size={20} />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-6">No staff members found yet.</p>
            ) : (
              <div className="space-y-4">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className={`rounded-3xl border p-4 shadow-sm transition ${
                      member.active ? 'border-border-default bg-surface-raised' : 'border-border-muted bg-surface-base'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-text-primary">{member.name}</p>
                        <p className="text-sm text-text-secondary">{member.email}</p>
                        <p className="text-xs text-text-tertiary mt-1">Joined {new Date(member.createdAt).toLocaleDateString('en-GH')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gold-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
                          {member.role.replace('_', ' ')}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          member.active ? 'bg-success-muted text-success' : 'bg-error-muted text-error'
                        }`}>
                          {member.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-text-secondary">
                      <span>{member.phone || 'No phone set'}</span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeactivate(member.id)}
                          disabled={!member.active || member.role === 'OWNER'}
                        >
                          <UserMinus size={16} /> {member.role === 'OWNER' ? 'Owner account' : 'Deactivate'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          disabled={member.role === 'OWNER'}
                        >
                          <Trash2 size={16} /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <PaginationControls
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(value) => { setLimit(value); setPage(0); }}
                hasMore={staff.length === limit}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gold-muted border-border-default">
          <CardHeader>
            <CardTitle>Staff Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary mb-4">
              Use the staff manager to create and maintain your branch team.
            </p>
            <div className="space-y-3">
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-sm text-text-secondary">Today&apos;s shift count</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{todayShifts.length}</p>
              </div>
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-sm text-text-secondary">Clocked in</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{clockedIn.length}</p>
              </div>
              <div className="rounded-3xl bg-surface-base p-4">
                <p className="text-sm text-text-secondary">Clocked out</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{clockedOut.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-center justify-center bg-black/40 p-4 overflow-auto">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Add new staff member</h2>
                <p className="text-sm text-text-secondary mt-1">Add a team member with role, email, and password in one interface.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-2 text-text-secondary hover:bg-surface-elevated"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-3xl bg-error-muted p-4 text-sm text-error">{error}</div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleCreateStaff}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">Name</span>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    required
                    className="mt-2 w-full rounded-2xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">Email</span>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    required
                    className="mt-2 w-full rounded-2xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">Password</span>
                  <input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    required
                    minLength={6}
                    className="mt-2 w-full rounded-2xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-text-secondary">Role</span>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"
                  >
                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                    <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    <option value="GROWTH_LEAD">Growth Lead</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" loading={saving}>
                  Add Staff Member
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
