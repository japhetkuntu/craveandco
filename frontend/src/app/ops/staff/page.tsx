'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { get, post } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { KPICard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import { Users, Clock, UserCheck, UserX } from 'lucide-react';
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

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

interface LaborRatio {
  totalSales: number;
  totalHours: number;
  staffCount: number;
  laborRatio: number;
}

export default function OpsStaffPage() {
  const { token, user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [creatingShift, setCreatingShift] = useState(false);
  const [laborRatio, setLaborRatio] = useState<LaborRatio | null>(null);
  const [activeAttendance, setActiveAttendance] = useState<ActiveAttendance | null>(null);
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(null);
  const [newShift, setNewShift] = useState({ role: 'KITCHEN_STAFF', slot: 'MORNING', date: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '16:00' });

  useEffect(() => {
    if (!token) return;
    const weekStart = getWeekStart(new Date());
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      get(`/api/v1/shifts?weekStart=${weekStart}`, token),
      get(`/api/v1/labor/daily-ratio?date=${today}`, token),
      get('/api/v1/attendance/active', token).catch(() => null),
    ])
      .then(([s, ratio, active]) => {
        setShifts(s);
        setLaborRatio(ratio);
        setActiveAttendance(active);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleClockIn = async () => {
    if (!token || !user?.branchId) return;
    setAttendanceMessage(null);
    try {
      const attendance = await post('/api/v1/attendance/clock-in', { branchId: user.branchId }, token);
      setActiveAttendance(attendance);
      setAttendanceMessage('Clocked in successfully.');
    } catch (err: any) {
      setAttendanceMessage(err?.message || 'Unable to clock in.');
      console.error(err);
    }
  };

  const handleClockOut = async () => {
    if (!token || !activeAttendance) {
      setAttendanceMessage('No active clock-in found. Please clock in first.');
      return;
    }
    setAttendanceMessage(null);
    try {
      await post('/api/v1/attendance/clock-out', {}, token);
      setActiveAttendance(null);
      setAttendanceMessage('Clocked out successfully.');
    } catch (err: any) {
      const message = err?.message?.includes('No active clock-in')
        ? 'No active clock-in found. Please clock in before clocking out.'
        : 'Unable to clock out at this time.';
      setAttendanceMessage(message);
      console.error(err);
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
      setLoading(true);
      const weekStart = getWeekStart(new Date());
      const today = new Date().toISOString().split('T')[0];
      const [s, ratio] = await Promise.all([
        get(`/api/v1/shifts?weekStart=${weekStart}`, token),
        get(`/api/v1/labor/daily-ratio?date=${today}`, token),
      ]);
      setShifts(s);
      setLaborRatio(ratio);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingShift(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter((s) => s.date === today);
  const clockedIn = todayShifts.filter((s) => s.clockIn && !s.clockOut);

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
            <Users className="text-gold" /> Staff Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">Schedule shifts, track who&apos;s on duty, and make labor decisions with confidence.</p>
        </div>
        <Button onClick={() => setShowShiftModal(true)}>Create Shift</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Scheduled" value={todayShifts.length} icon={<Clock size={20} />} />
        <KPICard title="On Duty" value={clockedIn.length} icon={<UserCheck size={20} />} severity="healthy" />
        <KPICard title="Total Shifts" value={shifts.length} icon={<Users size={20} />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Labor Hours" value={laborRatio ? laborRatio.totalHours : 0} icon={<Clock size={20} />} />
        <KPICard title="Staff Count" value={laborRatio ? laborRatio.staffCount : 0} icon={<Users size={20} />} />
        <KPICard title="Labor Ratio" value={`${laborRatio ? laborRatio.laborRatio : 0}%`} icon={<UserX size={20} />} severity={(laborRatio?.laborRatio || 0) < 30 ? 'healthy' : 'warning'} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={handleClockIn} disabled={!!activeAttendance}>
            Clock In
          </Button>
          <Button size="sm" variant="secondary" onClick={handleClockOut} disabled={!activeAttendance}>
            Clock Out
          </Button>
        </div>
        {attendanceMessage && (
          <div className="rounded-3xl border border-border-default bg-surface-base p-3 text-sm text-text-secondary">
            {attendanceMessage}
          </div>
        )}
        {activeAttendance ? (
          <div className="rounded-3xl bg-success-muted p-3 text-sm text-success">
            You are currently clocked in since {formatTime(activeAttendance.clockIn)}.
          </div>
        ) : (
          <div className="rounded-3xl bg-warning-muted p-3 text-warning">
            No active clock-in detected. Use Clock In to start your shift.
          </div>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Today&apos;s Schedule</CardTitle></CardHeader>
        <CardContent>
          {todayShifts.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No shifts today</p>
          ) : (
            <div className="space-y-2">
              {todayShifts.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-surface-base rounded-xl">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{s.user?.name}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gold-muted text-gold">{s.slot}</span>
                  </div>
                  {s.clockIn && !s.clockOut && (
                    <span className="text-xs text-success font-medium">On Duty</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck size={18} className="text-success" /> Currently On Duty
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clockedIn.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No one on duty</p>
          ) : (
            <div className="space-y-2">
              {clockedIn.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-success-muted rounded-xl">
                  <span className="text-sm font-medium text-text-primary">{s.user?.name}</span>
                  <span className="text-xs text-text-secondary">Since {formatTime(s.clockIn!)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title="Create Shift"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowShiftModal(false)}>Cancel</Button>
            <Button loading={creatingShift} onClick={handleCreateShift}>Create Shift</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateShift}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={newShift.date}
              onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-text-secondary">Role</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-text-primary"
                value={newShift.role}
                onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
              >
                <option value="KITCHEN_STAFF">Kitchen</option>
                <option value="OPERATIONS_MANAGER">Operations</option>
                <option value="CASHIER">Cashier</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary">Shift Slot</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-border-default bg-surface-input text-text-primary"
                value={newShift.slot}
                onChange={(e) => setNewShift({ ...newShift, slot: e.target.value })}
              >
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start"
                type="time"
                value={newShift.startTime}
                onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                required
              />
              <Input
                label="End"
                type="time"
                value={newShift.endTime}
                onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
