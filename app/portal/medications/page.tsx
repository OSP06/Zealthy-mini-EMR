'use client';

import { useEffect, useState } from 'react';
import { addWeeks, addMonths, isBefore, isAfter } from 'date-fns';

interface Rx {
  id: number; medication: string; dosage: string; quantity: number;
  refillOn: string; refillSchedule: string;
  status: string; notes?: string;
}

function getAllRefills(start: Date, schedule: string, toDate: Date): Date[] {
  const occ: Date[] = [];
  const now = new Date();
  let cur = new Date(start);
  while (isBefore(cur, now)) cur = advance(cur, schedule);
  while (!isAfter(cur, toDate)) { occ.push(new Date(cur)); cur = advance(cur, schedule); }
  return occ;
}

function advance(d: Date, s: string): Date {
  if (s === 'weekly') return addWeeks(d, 1);
  if (s === 'quarterly') return addMonths(d, 3);
  return addMonths(d, 1);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function PortalMedications() {
  const [prescriptions, setPrescriptions] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(async ({ user }) => {
      if (!user) return;
      const r = await fetch(`/api/patients/${user.id}/prescriptions`);
      const data = await r.json();
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#0d9488' }}>Loading…</div>;

  const threeMonths = addMonths(new Date(), 3);
  const active = prescriptions.filter(r => (r.status || 'active') === 'active');
  const inactive = prescriptions.filter(r => (r.status || 'active') !== 'active');
  const displayed = showInactive ? prescriptions : active;

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '28px' }}>My Medications</h1>
            <p style={{ margin: 0, color: '#4a7c73', fontSize: '15px' }}>
              Prescriptions and upcoming refill schedule (next 3 months)
            </p>
          </div>
          {inactive.length > 0 && (
            <button onClick={() => setShowInactive(v => !v)} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              {showInactive ? 'Hide' : 'Show'} inactive ({inactive.length})
            </button>
          )}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💊</div>
          <h3 style={{ color: '#4a7c73' }}>No prescriptions on file</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayed.map((rx, i) => {
            const status = rx.status || 'active';
            const isActive = status === 'active';
            const refills = isActive ? getAllRefills(new Date(rx.refillOn), rx.refillSchedule, threeMonths) : [];
            const nextRefill = refills[0];
            const days = nextRefill ? daysUntil(nextRefill) : null;
            const isUrgent = days !== null && days <= 7;
            const isOpen = expanded === rx.id;

            return (
              <div key={rx.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{
                  background: isActive ? 'white' : '#fafafa',
                  border: `1px solid ${!isActive ? '#e2e8f0' : isUrgent ? '#fbbf24' : '#d1fae5'}`,
                  borderRadius: '12px', overflow: 'hidden', opacity: isActive ? 1 : 0.8,
                  boxShadow: isActive ? (isUrgent ? '0 2px 12px rgba(251,191,36,0.15)' : '0 1px 4px rgba(15,118,110,0.06)') : 'none',
                }}>
                  {!isActive && (
                    <div style={{
                      padding: '8px 20px',
                      background: status === 'discontinued' ? '#fffbeb' : '#eff6ff',
                      borderBottom: `1px solid ${status === 'discontinued' ? '#fde68a' : '#bfdbfe'}`,
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: status === 'discontinued' ? '#92400e' : '#1d4ed8' }}>
                        {status === 'discontinued' ? '⚠️ Discontinued' : '✓ Completed'}
                      </span>
                      {rx.notes && <span style={{ fontSize: '12px', color: '#64748b' }}>— {rx.notes}</span>}
                    </div>
                  )}

                  <div
                    onClick={() => isActive && setExpanded(isOpen ? null : rx.id)}
                    style={{
                      padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: isActive ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{
                        width: '48px', height: '48px',
                        background: !isActive ? '#f1f5f9' : isUrgent ? '#fef3c7' : '#f0fdf9',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '22px' }}>💊</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: isActive ? '#0f2623' : '#94a3b8' }}>
                          {rx.medication}
                        </div>
                        <div style={{ fontSize: '13px', color: '#4a7c73', marginTop: '1px' }}>
                          {rx.dosage} · Qty {rx.quantity}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          {isActive ? (
                            <>
                              <span className="badge badge-teal">{rx.refillSchedule} refills</span>
                              {isUrgent && <span className="badge badge-orange">Refill due soon</span>}
                            </>
                          ) : (
                            <span className="badge badge-slate">{rx.refillSchedule} refills</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {isActive ? (
                        <>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Next refill</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: isUrgent ? '#d97706' : '#0f766e' }}>
                            {nextRefill ? fmtDate(nextRefill) : 'N/A'}
                          </div>
                          <div style={{ fontSize: '11px', color: isUrgent ? '#d97706' : '#4a7c73', marginTop: '2px' }}>
                            {days !== null ? (days === 0 ? 'Today' : `in ${days} day${days !== 1 ? 's' : ''}`) : ''}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                            {isOpen ? '▲ Hide' : '▼ Show'} schedule
                          </div>
                        </>
                      ) : (
                        <span style={{
                          fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px',
                          background: status === 'discontinued' ? '#fffbeb' : '#eff6ff',
                          color: status === 'discontinued' ? '#92400e' : '#1d4ed8',
                        }}>
                          {status === 'discontinued' ? 'Discontinued' : 'Completed'}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOpen && isActive && (
                    <div style={{ borderTop: '1px solid #f0fdf9', padding: '16px 20px', background: '#f8fffe' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#4a7c73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                        Upcoming Refills (next 3 months)
                      </div>
                      {refills.length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#94a3b8' }}>No refills scheduled in this period.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {refills.map((d, j) => {
                            const d_days = daysUntil(d);
                            return (
                              <div key={j} style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '8px 12px', borderRadius: '7px',
                                background: j === 0 && d_days <= 7 ? '#fef3c7' : 'white',
                                border: '1px solid #d1fae5',
                              }}>
                                <span style={{ fontSize: '13px', color: '#0f2623' }}>{fmtDate(d)}</span>
                                <span style={{ fontSize: '13px', color: d_days <= 7 ? '#d97706' : '#4a7c73', fontWeight: d_days <= 7 ? 600 : 400 }}>
                                  {d_days === 0 ? 'Today' : d_days === 1 ? 'Tomorrow' : `in ${d_days} days`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}