'use client';

import { useEffect, useState } from 'react';
import { addMonths, addWeeks, addDays, isWithinInterval, isAfter, isBefore } from 'date-fns';
import { useToast } from '@/components/ToastProvider';

interface Appt { id: number; provider: string; datetime: string; repeat: string; endDate?: string; }
interface Rx { id: number; medication: string; dosage: string; quantity: number; refillOn: string; refillSchedule: string; }
interface Patient { id: number; name: string; email: string; dateOfBirth?: string; phone?: string; address?: string; appointments: Appt[]; prescriptions: Rx[]; }

function getNextOccurrence(start: Date, repeat: string, endDate: Date | null): Date | null {
  const now = new Date();
  let current = new Date(start);
  if (endDate && isAfter(current, endDate)) return null;
  while (isBefore(current, now)) {
    if (repeat === 'none') return null;
    if (repeat === 'daily') current = addDays(current, 1);
    else if (repeat === 'weekly') current = addWeeks(current, 1);
    else if (repeat === 'monthly') current = addMonths(current, 1);
    else break;
    if (endDate && isAfter(current, endDate)) return null;
  }
  return isAfter(current, now) ? current : null;
}

function fmtDT(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---- Edit Profile Modal ----
function EditProfileModal({ patient, onClose, onSaved }: {
  patient: Patient; onClose: () => void; onSaved: (updated: Patient) => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: patient.name,
    phone: patient.phone || '',
    dateOfBirth: patient.dateOfBirth || '',
    address: patient.address || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: patient.email }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error saving'); return; }
      const updated = await res.json();
      showToast('Profile updated successfully', 'success');
      onSaved({ ...patient, ...updated });
      onClose();
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px' }}>Edit My Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#4a7c73', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              value={patient.email}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <div style={{ fontSize: '11px', color: '#4a7c73', marginTop: '3px' }}>Contact your provider to change your email</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(555) 000-0000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                className="form-input"
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              className="form-input"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="123 Main St, New York, NY 10001"
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Dashboard ----
export default function PortalDashboard() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

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

  const now = new Date();
  const in7 = addDays(now, 7);

  const urgentAppts: { appt: Appt; date: Date }[] = [];
  for (const appt of patient.appointments) {
    const next = getNextOccurrence(new Date(appt.datetime), appt.repeat, appt.endDate ? new Date(appt.endDate) : null);
    if (next && isWithinInterval(next, { start: now, end: in7 })) urgentAppts.push({ appt, date: next });
  }

  const urgentRx: { rx: Rx; date: Date }[] = [];
  for (const rx of patient.prescriptions) {
    const next = getNextOccurrence(new Date(rx.refillOn), rx.refillSchedule, null);
    if (next && isWithinInterval(next, { start: now, end: in7 })) urgentRx.push({ rx, date: next });
  }

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '28px', color: '#0f2623' }}>
          Welcome back, {patient.name.split(' ')[0]} 👋
        </h1>
        <p style={{ margin: 0, color: '#4a7c73', fontSize: '15px' }}>Here's your health summary for today.</p>
      </div>

      {/* Urgent alert */}
      {(urgentAppts.length > 0 || urgentRx.length > 0) && (
        <div className="animate-fade-up stagger-1" style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '1px solid #fbbf24', borderRadius: '12px',
          padding: '16px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <strong style={{ color: '#92400e', fontSize: '14px' }}>Action needed this week: </strong>
            <span style={{ color: '#78350f', fontSize: '14px' }}>
              {urgentAppts.length > 0 && `${urgentAppts.length} upcoming appointment${urgentAppts.length > 1 ? 's' : ''}`}
              {urgentAppts.length > 0 && urgentRx.length > 0 && ' · '}
              {urgentRx.length > 0 && `${urgentRx.length} medication refill${urgentRx.length > 1 ? 's' : ''} due`}
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="animate-fade-up stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Appointments', value: patient.appointments.length, icon: '📅', color: '#0d9488' },
          { label: 'Active Prescriptions', value: patient.prescriptions.length, icon: '💊', color: '#7c3aed' },
          { label: 'Urgent This Week', value: urgentAppts.length + urgentRx.length, icon: '🔔', color: urgentAppts.length + urgentRx.length > 0 ? '#d97706' : '#0d9488' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '18', color: s.color }}>
              <span style={{ fontSize: '20px' }}>{s.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f2623', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: '#4a7c73', marginTop: '3px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Upcoming appointments */}
        <div className="card animate-fade-up stagger-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Upcoming Appointments</h3>
            <a href="/portal/appointments" style={{ fontSize: '13px', color: '#0d9488', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
          </div>
          {patient.appointments.length === 0 ? (
            <p style={{ color: '#4a7c73', fontSize: '14px' }}>No appointments scheduled.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {patient.appointments.slice(0, 3).map(appt => {
                const next = getNextOccurrence(new Date(appt.datetime), appt.repeat, appt.endDate ? new Date(appt.endDate) : null);
                const isUrgent = next && isWithinInterval(next, { start: now, end: in7 });
                return (
                  <div key={appt.id} style={{
                    padding: '12px 14px', borderRadius: '8px',
                    background: isUrgent ? '#fef3c7' : '#f0fdf9',
                    border: `1px solid ${isUrgent ? '#fbbf24' : '#d1fae5'}`,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f2623' }}>{appt.provider}</div>
                    <div style={{ fontSize: '12px', color: '#4a7c73', marginTop: '2px' }}>
                      {next ? fmtDT(next) : fmtDT(appt.datetime)}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <span className="badge badge-teal">{appt.repeat === 'none' ? 'One-time' : appt.repeat}</span>
                      {isUrgent && <span className="badge badge-orange">This week</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="card animate-fade-up stagger-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>My Medications</h3>
            <a href="/portal/medications" style={{ fontSize: '13px', color: '#0d9488', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
          </div>
          {patient.prescriptions.length === 0 ? (
            <p style={{ color: '#4a7c73', fontSize: '14px' }}>No prescriptions on file.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {patient.prescriptions.map(rx => {
                const next = getNextOccurrence(new Date(rx.refillOn), rx.refillSchedule, null);
                const isUrgent = next && isWithinInterval(next, { start: now, end: in7 });
                return (
                  <div key={rx.id} style={{
                    padding: '12px 14px', borderRadius: '8px',
                    background: isUrgent ? '#fef3c7' : '#f0fdf9',
                    border: `1px solid ${isUrgent ? '#fbbf24' : '#d1fae5'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f2623' }}>{rx.medication}</div>
                      <div style={{ fontSize: '12px', color: '#4a7c73' }}>{rx.dosage} · Qty {rx.quantity}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#4a7c73' }}>Next refill</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: isUrgent ? '#d97706' : '#0f766e' }}>
                        {next ? fmtDate(next) : fmtDate(rx.refillOn)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Patient info card — full width, with edit button */}
        <div className="card animate-fade-up stagger-5" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>My Information</h3>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '6px 14px' }}
              onClick={() => setEditProfileOpen(true)}
            >
              ✏️ Edit Profile
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Full Name', value: patient.name },
              { label: 'Email', value: patient.email },
              { label: 'Date of Birth', value: patient.dateOfBirth || '—' },
              { label: 'Phone', value: patient.phone || '—' },
              { label: 'Address', value: patient.address || '—' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#4a7c73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{f.label}</div>
                <div style={{ fontSize: '14px', color: '#0f2623' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit profile modal */}
      {editProfileOpen && (
        <EditProfileModal
          patient={patient}
          onClose={() => setEditProfileOpen(false)}
          onSaved={(updated) => setPatient(updated)}
        />
      )}
    </div>
  );
}
