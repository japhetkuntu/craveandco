'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import { Users, UserCheck, Clock, Plus } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

interface Shift {
  id: string;
  slot: string;
  date: string;
  user: { id: string; name: string };
  clockIn?: string | null;
  clockOut?: string | null;
}

interface ActiveAttendance {
  id: string;
  clockIn: string;
  clockOut?: string | null;
}

interface LaborRatio {
  totalSales: number;
  totalHours: number;
  staffCount: number;
  laborRatio: number;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function OpsStaffPage() {
  const { token, user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [creatingShift, setCreatingShift] = useState(false);
  const [laborRatio, setLaborRatio] = useState<LaborRatio | null>(null);
  const [activeAttendance, setActiveAttendance] = useState<ActiveAttendance | null>(null);
  const [attendanceMessage, setAttendanceMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [newShift, setNewShift] = useState({
    role: 'KITCHEN_STAFF',
    slot: 'MORNING',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
  });

  const loadData = async () => {
    if (!token) return;
    const weekStart = getWeekStart(new Date());
    const today = new Date().toISOString().split('T')[0];
    const [s, ratio, active] = await Promise.all([
      get(`/api/v1/shifts?weekStart=${weekStart}`, token),
      get(`/api/v1/labor/daily-ratio?date=${today}`, token),
      get('/api/v1/attendance/active', token).catch(() => null),
    ]);
    setShifts(s);
    setLaborRatio(ratio);
    setActiveAttendance(active);
  };

  useEffect(() => {
    if (!token) return;
    loadData().catch(console.error).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleClockIn = async () => {
    if (!token || !user?.branchId) return;
    setAttendanceMessage(null);
    try {
      const attendance = await post('/api/v1/attendance/clock-in', { branchId: user.branchId }, token);
      setActiveAttendance(attendance);
      setAttendanceMessage({ text: 'Clocked in successfully. Have a great shift!', ok: true });
    } catch (err: any) {
      setAttendanceMessage({ text: err?.message || 'Unable to clock in. Please try again.', ok: false });
    }
  };

  const handleClockOut = async () => {
    if (!token || !activeAttendance) {
      setAttendanceMessage({ text: 'You are not clocked in yet.', ok: false });
      return;
    }
    setAttendanceMessage(null);
    try {
      await post('/api/v1/attendance/clock-out', {}, token);
      setActiveAttendance(null);
      setAttendanceMessage({ text: 'Clocked out. See you next shift!', ok: true });
    } catch (err: any) {
      const msg = err?.message?.includes('No active clock-in')
        ? 'No active clock-in found. Please clock in first.'
        : 'Unable to clock out right now. Please try again.';
      setAttendanceMessage({ text: msg, ok: false });
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.branchId) return;
    setCreatingShift(true);
    try {
      await post('/api/v1/shifts', {
        branchId: user.branchId,
        role: newShift.role,
        slot: newShift.slot,
        date: newShift.date,
        startTime: newShift.startTime,
        endTime: newShift.endTime,
      }, token);
      setShowShiftModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingShift(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter((s) => s.date === todayStr);
  const clockedIn = todayShifts.filter((s) => s.clockIn && !s.clockOut);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="text-gold" /> Staff
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {clockedIn.length > 0
              ? `${clockedIn.length} staff member${clockedIn.length > 1 ? 's' : ''} currently on duty`
              : 'No one is clocked in right now'}
          </p>
        </div>
        <Button onClick={() => setShowShiftModal(true)} size="sm">
          <Plus size={15} /> Add Shift
        </Button>
      </div>

      {/* Clock In / Out — most important action, prominent placement */}
      <div className="rounded-2xl bg-surface-raised border border-border-subtle p-5 space-y-4">
        <h2 className="font-semibold text-text-primary text-sm">Your Attendance</h2>

        {activeAttendance ? (
          <div className="rounded-xl bg-success-muted border border-success/30 p-3 text-sm text-success font-medium flex items-center gap-2">
            <UserCheck size={16} className="shrink-0" />
            You clocked in at {formatTime(activeAttendance.clockIn)}
          </div>
        ) : (
          <div className="rounded-xl bg-warning-muted border border-warning/30 p-3 text-sm text-warning font-medium flex items-center gap-2">
            <Clock size={16} className="shrink-0" />
            You are not clocked in yet
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleClockIn}
            disabled={!!activeAttendance}
            className="flex-1"
          >
            Clock In
          </Button>
          <Button
            variant="secondary"
            onClick={handleClockOut}
            disabled={!activeAttendance}
            className="flex-1"
          >
            Clock Out
          </Button>
        </div>

        {attendanceMessage && (
          <p className={`text-sm font-medium ${attendanceMessage.ok ? 'text-success' : 'text-error'}`}>
            {attendanceMessage.text}
          </p>
        )}
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-4">
          <p className="text-xs text-text-secondary">On duty now</p>
          <p className="text-2xl font-bold font-mono text-success mt-1">{clockedIn.length}</p>
          <p className="text-xs text-text-tertiary mt-0.5">Clocked in</p>
        </div>
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-4">
          <p className="text-xs text-text-secondary">Scheduled today</p>
          <p className="text-2xl font-bold font-mono text-text-primary mt-1">{todayShifts.length}</p>
          <p className="text-xs text-text-tertiary mt-0.5">Shifts</p>
        </div>
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-4">
          <p className="text-xs text-text-secondary">Labor ratio</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${(laborRatio?.laborRatio ?? 0) > 30 ? 'text-warning' : 'text-text-primary'}`}>
            {laborRatio?.laborRatio ?? 0}%
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">Staff cost vs revenue</p>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Today&apos;s Schedule</p>
        </div>
        <div className="p-4">
          {todayShifts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-secondary">No shifts scheduled for today</p>
              <button
                onClick={() => setShowShiftModal(true)}
                className="mt-3 text-sm text-gold font-semibold hover:underline"
              >
                + Add a shift
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayShifts.map((s) => {
                const isOnDuty = !!s.clockIn && !s.clockOut;
                return (
                  <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl ${isOnDuty ? 'bg-success-muted border border-success/30' : 'bg-surface-elevated border border-border-subtle'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isOnDuty ? 'bg-success text-white' : 'bg-surface-raised text-text-secondary'}`}>
                        {s.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{s.user?.name}</p>
                        <p className="text-xs text-text-tertiary capitalize">{s.slot.toLowerCase()} shift</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isOnDuty ? 'text-success bg-success-muted' : 'text-text-tertiary bg-surface-raised'}`}>
                      {isOnDuty ? 'On Duty' : s.clockIn ? `Left ${formatTime(s.clockOut!)}` : 'Not started'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* This week's shifts (collapsed summary) */}
      {shifts.length > todayShifts.length && (
        <div className="rounded-3xl border border-border-default bg-surface-raised overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle"><p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">This Week ({shifts.length} total shifts)</p></div>
          <div className="p-4">
            <div className="space-y-1.5">
              {shifts
                .filter((s) => s.date !== todayStr)
                .slice(0, 10)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-elevated">
                    <span className="text-sm text-text-primary">{s.user?.name}</span>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <span>{new Date(s.date).toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric' })}</span>
                      <span className="capitalize">{s.slot.toLowerCase()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 [height:var(--viewport-height,100dvh)] z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white shadow-2xl max-h-[calc(var(--viewport-height,100dvh)-4rem)] overflow-hidden flex flex-col">
            <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Add a Shift</h2>
                <p className="text-sm text-text-secondary mt-1">Schedule a new shift for your team.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowShiftModal(false)}>Close</Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form id="shift-form" className="space-y-4" onSubmit={handleCreateShift}>
                <Input
                  label="Date"
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Role</label>
                  <select
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    value={newShift.role}
                    onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
                  >
                    <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Shift Time</label>
                  <select
                    className="h-12 w-full rounded-2xl border border-border-default bg-surface-input px-4 text-sm text-text-primary outline-none focus:border-[var(--color-gold)]"
                    value={newShift.slot}
                    onChange={(e) => setNewShift({ ...newShift, slot: e.target.value })}
                  >
                    <option value="MORNING">Morning</option>
                    <option value="AFTERNOON">Afternoon</option>
                    <option value="EVENING">Evening</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start time"
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    required
                  />
                  <Input
                    label="End time"
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    required
                  />
                </div>
              </form>
            </div>
            <div className="sticky bottom-0 border-t border-border-subtle bg-white px-6 py-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowShiftModal(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" loading={creatingShift} onClick={handleCreateShift}>Save Shift</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
