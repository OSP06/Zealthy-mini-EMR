'use client';

import { useEffect, useState } from 'react';
import { addWeeks, addDays, addMonths, isBefore, isAfter } from 'date-fns';

interface Appt {
  id: number; provider: string; datetime: string; repeat: string;
  endDate?: string; status: string; notes?: string;
}

function getAllOccurrences(start: Date, repeat: string, endDate: Date | null, toDate: Date): Date[] {
  const occ: Date[] = [];
  const now = new Date();
  let cur = new Date(start);
  while (isBefore(cur, now)) {
    if (repeat === 'none') return [];
    cur = advance(cur, repeat);
    if (endDate && isAfter(cur, endDate)) return occ;
  }
  while (!isAfter(cur, toDate)) {
    if (endDate && isAfter(cur, endDate)) break;
    occ.push(new Date(cur));
    if (repeat === 'none') break;
    cur = advance(cur, repeat);
  }
  return occ;
}

function advance(d: Date, r: string): Date {
  if (r === 'daily') return addDays(d, 1);
  if (r === 'weekly') return addWeeks(d, 1);
  if (r === 'monthly') return addMonths(d, 1);
  return addDays(d, 9999);
}

function fmtDT(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function PortalAppointments() {
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(async ({ user }) => {
      if (!user) return;
      const r = await fetch(`/api/patients/${user.id}/appointments`);
      const data = await r.json();
      setAppointments(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#0d9488' }}>Loading…</div>;

  const threeMonths = addMonths(new Date(), 3);
  const activeAppts = appointments.filter(a => (a.status || 'active') === 'active');
  const inactiveAppts = appointments.filter(a => (a.status || 'active') !== 'active');

  const schedule: { appt: Appt; date: Date }[] = [];
  for (const appt of activeAppts) {
    const occ = getAllOccurrences(
      new Date(appt.datetime), appt.repeat,
      appt.endDate ? new Date(appt.endDate) : null,
      threeMonths
    );
    for (const d of occ) schedule.push({ appt, date: d });
  }
  schedule.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '28px' }}>My Appointments</h1>
            <p style={{ margin: 0, color: '#4a7c73', fontSize: '15px' }}>Full schedule for the next 3 months</p>
          </div>
          {inactiveAppts.length > 0 && (
            <button onClick={() => setShowInactive(v => !v)} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              {showInactive ? 'Hide' : 'Show'} cancelled/completed ({inactiveAppts.length})
            </button>
          )}
        </div>
      </div>

      {schedule.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
          <h3 style={{ color: '#4a7c73' }}>No upcoming appointments</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Contact your provider to schedule an appointment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {schedule.map(({ appt, date }, i) => {
            const days = daysUntil(date);
            const isThisWeek = days <= 7;
            return (
              <div key={`${appt.id}-${i}`} className="animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <div style={{
                  border: `1px solid ${isThisWeek ? '#fbbf24' : '#d1fae5'}`,
                  borderRadius: '12px', padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'white',
                  boxShadow: isThisWeek ? '0 2px 12px rgba(251,191,36,0.15)' : '0 1px 4px rgba(15,118,110,0.06)',
                }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{
                      width: '48px', height: '48px',
                      background: isThisWeek ? '#fef3c7' : '#f0fdf9',
                      borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '22px' }}>📅</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: '#0f2623' }}>{appt.provider}</div>
                      <div style={{ fontSize: '13px', color: '#4a7c73', marginTop: '2px' }}>{fmtDT(date)}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <span className="badge badge-teal">{appt.repeat === 'none' ? 'One-time' : `Repeats ${appt.repeat}`}</span>
                        {isThisWeek && <span className="badge badge-orange">This week</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: isThisWeek ? '#d97706' : '#0d9488' }}>
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>away</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showInactive && inactiveAppts.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Cancelled & Completed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {inactiveAppts.map(appt => {
              const status = appt.status || 'active';
              return (
                <div key={appt.id} style={{
                  border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', opacity: 0.8, background: '#fafafa',
                }}>
                  <div style={{
                    padding: '7px 16px',
                    background: status === 'cancelled' ? '#fef2f2' : '#eff6ff',
                    borderBottom: `1px solid ${status === 'cancelled' ? '#fecaca' : '#bfdbfe'}`,
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: status === 'cancelled' ? '#b91c1c' : '#1d4ed8' }}>
                      {status === 'cancelled' ? '✕ Cancelled' : '✓ Completed'}
                    </span>
                    {appt.notes && <span style={{ fontSize: '12px', color: '#64748b' }}>— {appt.notes}</span>}
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px' }}>📅</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#94a3b8' }}>{appt.provider}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(appt.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {appt.repeat !== 'none' && ` · Repeats ${appt.repeat}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}