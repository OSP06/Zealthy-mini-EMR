'use client';

import { useEffect, useState } from 'react';

interface Appt {
  id: number; provider: string; datetime: string; repeat: string;
  endDate?: string; status: string; notes?: string; createdAt: string;
}
interface Rx {
  id: number; medication: string; dosage: string; quantity: number;
  refillOn: string; refillSchedule: string; status: string; notes?: string; createdAt: string;
}
interface Patient {
  id: number; name: string;
  appointments: Appt[];
  prescriptions: Rx[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDT(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Parse dosage number for comparison e.g. "50mg" -> 50
function parseDosageMg(d: string): number {
  return parseFloat(d.replace(/[^0-9.]/g, '')) || 0;
}

// For each medication, group all prescriptions by name and sort by createdAt
// Returns map of medication -> sorted Rx[]
function groupRxByMedication(rxList: Rx[]): Map<string, Rx[]> {
  const map = new Map<string, Rx[]>();
  for (const rx of rxList) {
    if (!map.has(rx.medication)) map.set(rx.medication, []);
    map.get(rx.medication)!.push(rx);
  }
  // sort each group oldest first
  map.forEach(list => list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  return map;
}

type TimelineEntry =
  | { kind: 'appt'; data: Appt; date: Date }
  | { kind: 'rx'; data: Rx; date: Date; prevDosage?: string };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:       { label: 'Active',        color: '#0f766e', bg: '#f0fdf9', dot: '#14b8a6' },
  completed:    { label: 'Completed',     color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
  cancelled:    { label: 'Cancelled',     color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444' },
  discontinued: { label: 'Discontinued',  color: '#92400e', bg: '#fffbeb', dot: '#f59e0b' },
};

export default function MedicalHistory() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'appointments' | 'prescriptions'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inactive'>('all');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(async ({ user }) => {
      if (!user) return;
      const r = await fetch(`/api/patients/${user.id}`);
      const data = await r.json();
      setPatient(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#0d9488', padding: '20px' }}>Loading…</div>;
  if (!patient) return null;

  // Build medication history map for dosage diff
  const rxByMed = groupRxByMedication(patient.prescriptions);

  // Build unified timeline entries
  const entries: TimelineEntry[] = [];

  for (const appt of patient.appointments) {
    entries.push({ kind: 'appt', data: appt, date: new Date(appt.datetime) });
  }

  for (const rx of patient.prescriptions) {
    // Find previous prescription of same medication (by createdAt order)
    const group = rxByMed.get(rx.medication) || [];
    const idx = group.findIndex(r => r.id === rx.id);
    const prev = idx > 0 ? group[idx - 1] : undefined;
    entries.push({
      kind: 'rx',
      data: rx,
      date: new Date(rx.createdAt),
      prevDosage: prev?.dosage,
    });
  }

  // Filter
  let filtered = entries;
  if (filter === 'appointments') filtered = filtered.filter(e => e.kind === 'appt');
  if (filter === 'prescriptions') filtered = filtered.filter(e => e.kind === 'rx');
  if (statusFilter === 'inactive') {
    filtered = filtered.filter(e =>
      e.kind === 'appt'
        ? e.data.status !== 'active'
        : e.data.status !== 'active'
    );
  }

  // Sort newest first
  filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Stats
  const totalAppts = patient.appointments.length;
  const cancelledAppts = patient.appointments.filter(a => a.status === 'cancelled').length;
  const completedAppts = patient.appointments.filter(a => a.status === 'completed').length;
  const totalRx = patient.prescriptions.length;
  const discontinuedRx = patient.prescriptions.filter(r => r.status === 'discontinued').length;
  const activeRx = patient.prescriptions.filter(r => r.status === 'active').length;

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '28px', color: '#0f2623' }}>Medical History</h1>
        <p style={{ margin: 0, color: '#4a7c73', fontSize: '15px' }}>
          Your complete record of appointments and prescriptions, including past and inactive entries.
        </p>
      </div>

      {/* Stats row */}
      <div className="animate-fade-up stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Appointments', value: totalAppts, sub: `${completedAppts} completed · ${cancelledAppts} cancelled`, color: '#0d9488' },
          { label: 'Active Prescriptions', value: activeRx, sub: `${discontinuedRx} discontinued`, color: '#7c3aed' },
          { label: 'Total Prescriptions', value: totalRx, sub: 'all time', color: '#0d9488' },
          { label: 'Unique Medications', value: rxByMed.size, sub: rxByMed.size > 0 ? `incl. ${Array.from(rxByMed.keys()).join(', ')}` : 'none', color: '#0284c7' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f2623' }}>{s.label}</div>
            <div style={{ fontSize: '11px', color: '#4a7c73' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="animate-fade-up stagger-2" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'white', border: '1px solid #d1fae5', borderRadius: '10px', padding: '4px' }}>
          {(['all', 'appointments', 'prescriptions'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, transition: 'all 0.15s',
              background: filter === f ? '#0d9488' : 'transparent',
              color: filter === f ? 'white' : '#4a7c73',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', background: 'white', border: '1px solid #d1fae5', borderRadius: '10px', padding: '4px' }}>
          {([['all', 'All Records'], ['inactive', 'Inactive Only']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)} style={{
              padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, transition: 'all 0.15s',
              background: statusFilter === val ? '#7c3aed' : 'transparent',
              color: statusFilter === val ? 'white' : '#4a7c73',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗂️</div>
          <h3 style={{ color: '#4a7c73', margin: '0 0 8px' }}>No records found</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Try changing the filters above.</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: '19px', top: '24px', bottom: '24px',
            width: '2px', background: 'linear-gradient(to bottom, #d1fae5, #e0e7ff)',
            zIndex: 0,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((entry, i) => {
              const isAppt = entry.kind === 'appt';
              const status = entry.data.status || 'active';
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
              const isInactive = status !== 'active';

              return (
                <div key={`${entry.kind}-${entry.data.id}`}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 0.03}s`, display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>

                  {/* Timeline dot */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: isInactive ? '#f1f5f9' : cfg.bg,
                    border: `2px solid ${isInactive ? '#cbd5e1' : cfg.dot}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                  }}>
                    {isAppt ? '📅' : '💊'}
                  </div>

                  {/* Card */}
                  <div style={{
                    flex: 1, background: 'white',
                    border: `1px solid ${isInactive ? '#e2e8f0' : '#d1fae5'}`,
                    borderRadius: '12px', padding: '16px 18px',
                    opacity: isInactive ? 0.85 : 1,
                    boxShadow: isInactive ? 'none' : '0 1px 4px rgba(15,118,110,0.06)',
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '15px', color: '#0f2623' }}>
                            {isAppt ? entry.data.provider : entry.data.medication}
                          </span>
                          {/* Status badge */}
                          <span style={{
                            padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
                            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.dot}30`,
                          }}>
                            {cfg.label}
                          </span>
                          {/* Type badge */}
                          <span className="badge badge-slate" style={{ fontSize: '11px' }}>
                            {isAppt ? 'Appointment' : 'Prescription'}
                          </span>
                        </div>

                        {/* Subtitle */}
                        <div style={{ fontSize: '13px', color: '#4a7c73', marginTop: '4px' }}>
                          {isAppt
                            ? fmtDT(entry.data.datetime)
                            : `${entry.data.dosage} · Qty ${entry.data.quantity} · Refills ${entry.data.refillSchedule}`
                          }
                        </div>
                      </div>

                      {/* Date on right */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {isAppt ? 'Scheduled' : 'Prescribed'}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4a7c73' }}>
                          {fmtDate(isAppt ? entry.data.datetime : entry.data.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Dosage change diff — only for prescriptions with a previous entry */}
                    {!isAppt && (entry as Extract<TimelineEntry, { kind: 'rx' }>).prevDosage && (() => {
                      const prev = (entry as Extract<TimelineEntry, { kind: 'rx' }>).prevDosage!;
                      const curr = entry.data.dosage;
                      if (prev === curr) return (
                        <div style={{
                          marginTop: '10px', padding: '8px 12px',
                          background: '#f0fdf9', borderRadius: '8px',
                          border: '1px solid #d1fae5',
                          fontSize: '12px', color: '#0f766e',
                          display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                          <span>🔄</span>
                          <span>Re-prescribed at same dosage as previous course (<strong>{prev}</strong>)</span>
                        </div>
                      );

                      const prevMg = parseDosageMg(prev);
                      const currMg = parseDosageMg(curr);
                      const increased = currMg > prevMg;
                      const decreased = currMg < prevMg;

                      return (
                        <div style={{
                          marginTop: '10px', padding: '10px 12px',
                          background: increased ? '#fff7ed' : decreased ? '#f0fdf9' : '#f8fafc',
                          borderRadius: '8px',
                          border: `1px solid ${increased ? '#fed7aa' : decreased ? '#d1fae5' : '#e2e8f0'}`,
                          fontSize: '12px',
                        }}>
                          <div style={{ fontWeight: 600, color: '#0f2623', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{increased ? '📈' : '📉'}</span>
                            <span>Dosage {increased ? 'increased' : 'decreased'} from previous prescription</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{
                              padding: '4px 12px', borderRadius: '6px',
                              background: '#fee2e2', color: '#b91c1c',
                              fontWeight: 600, fontSize: '13px',
                              textDecoration: 'line-through',
                            }}>
                              {prev}
                            </div>
                            <span style={{ color: '#94a3b8', fontSize: '16px' }}>→</span>
                            <div style={{
                              padding: '4px 12px', borderRadius: '6px',
                              background: increased ? '#fef3c7' : '#dcfce7',
                              color: increased ? '#92400e' : '#166534',
                              fontWeight: 700, fontSize: '13px',
                            }}>
                              {curr}
                            </div>
                            <span style={{ color: '#4a7c73', fontSize: '12px' }}>
                              ({increased ? '+' : ''}{currMg - prevMg}mg change)
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Appointment repeat info */}
                    {isAppt && entry.data.repeat !== 'none' && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-teal">Repeats {entry.data.repeat}</span>
                        {entry.data.endDate && (
                          <span className="badge badge-slate">Until {fmtDate(entry.data.endDate)}</span>
                        )}
                      </div>
                    )}

                    {/* Notes / reason */}
                    {entry.data.notes && (
                      <div style={{
                        marginTop: '10px', padding: '8px 12px',
                        background: '#f8fafc', borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px', color: '#64748b',
                        display: 'flex', gap: '6px',
                      }}>
                        <span>📝</span>
                        <span><strong>Note:</strong> {entry.data.notes}</span>
                      </div>
                    )}
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
