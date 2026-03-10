'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MEDICATIONS, DOSAGES, REPEAT_OPTIONS, REFILL_SCHEDULES } from '@/lib/constants';
import { useToast } from '@/components/ToastProvider';

interface Appt { id: number; provider: string; datetime: string; repeat: string; endDate?: string | null; status?: string; notes?: string; }
interface Rx   { id: number; medication: string; dosage: string; quantity: number; refillOn: string; refillSchedule: string; status?: string; notes?: string; }
interface Patient { id: number; name: string; email: string; phone?: string; dateOfBirth?: string; address?: string; appointments: Appt[]; prescriptions: Rx[]; }

function fmtDT(d: string) { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function toDatetimeLocal(d: string) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
function toDateInput(d: string) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
}

function hasConflict(existing: Appt[], newDatetime: string, excludeId?: number): Appt | null {
  const newDt = new Date(newDatetime).getTime();
  for (const a of existing) {
    if (excludeId && a.id === excludeId) continue;
    const diff = Math.abs(new Date(a.datetime).getTime() - newDt);
    if (diff < 30 * 60 * 1000) return a;
  }
  return null;
}

function ApptModal({ appt, patientId, existingAppts, onClose, onSaved }: {
  appt: Appt | null; patientId: number; existingAppts: Appt[];
  onClose: () => void; onSaved: (saved: Appt) => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    provider: appt?.provider || '',
    datetime: appt ? toDatetimeLocal(appt.datetime) : '',
    repeat: appt?.repeat || 'none',
    endDate: appt?.endDate ? toDateInput(appt.endDate) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState<Appt | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'datetime' && value) setConflict(hasConflict(existingAppts, value, appt?.id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const url = appt ? `/api/patients/${patientId}/appointments/${appt.id}` : `/api/patients/${patientId}/appointments`;
      const res = await fetch(url, {
        method: appt ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, endDate: form.endDate || null }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      const saved = await res.json();
      showToast(appt ? 'Appointment updated' : 'Appointment scheduled', 'success');
      onSaved(saved); onClose();
    } catch { setError('Server error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontSize: '20px' }}>{appt ? 'Edit Appointment' : 'Schedule Appointment'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Provider Name *</label>
            <input className="form-input" name="provider" value={form.provider} onChange={handleChange} required placeholder="Dr. Jane Smith" />
          </div>
          <div className="form-group">
            <label className="form-label">Date & Time *</label>
            <input className="form-input" name="datetime" type="datetime-local" value={form.datetime} onChange={handleChange} required />
            {conflict && (
              <div style={{ marginTop: '6px', padding: '8px 12px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '7px', fontSize: '12px', color: '#92400e' }}>
                ⚠️ Conflict: <strong>{conflict.provider}</strong> is already at {fmtDT(conflict.datetime)} (within 30 min)
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Repeat Schedule</label>
            <select className="form-input" name="repeat" value={form.repeat} onChange={handleChange}>
              {REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {form.repeat !== 'none' && (
            <div className="form-group">
              <label className="form-label">End Recurring Appointments On</label>
              <input className="form-input" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
              <div style={{ fontSize: '11px', color: '#4a7c73', marginTop: '3px' }}>Leave blank for no end date</div>
            </div>
          )}
          {error && <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: '7px', color: '#b91c1c', fontSize: '13px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : appt ? 'Save Changes' : 'Schedule'}</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RxModal({ rx, patientId, onClose, onSaved }: {
  rx: Rx | null; patientId: number; onClose: () => void; onSaved: (saved: Rx) => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    medication: rx?.medication || MEDICATIONS[0],
    dosage: rx?.dosage || DOSAGES[0],
    quantity: String(rx?.quantity || 1),
    refillOn: rx ? toDateInput(rx.refillOn) : '',
    refillSchedule: rx?.refillSchedule || 'monthly',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const url = rx ? `/api/patients/${patientId}/prescriptions/${rx.id}` : `/api/patients/${patientId}/prescriptions`;
      const res = await fetch(url, {
        method: rx ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      const saved = await res.json();
      showToast(rx ? `${form.medication} updated` : `${form.medication} prescribed`, 'success');
      onSaved(saved); onClose();
    } catch { setError('Server error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontSize: '20px' }}>{rx ? 'Edit Prescription' : 'Add Prescription'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Medication *</label>
            <select className="form-input" name="medication" value={form.medication} onChange={handleChange}>
              {MEDICATIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Dosage *</label>
              <select className="form-input" name="dosage" value={form.dosage} onChange={handleChange}>
                {DOSAGES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-input" name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Next Refill Date *</label>
            <input className="form-input" name="refillOn" type="date" value={form.refillOn} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Refill Schedule</label>
            <select className="form-input" name="refillSchedule" value={form.refillSchedule} onChange={handleChange}>
              {REFILL_SCHEDULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: '7px', color: '#b91c1c', fontSize: '13px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : rx ? 'Save Changes' : 'Prescribe'}</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientModal({ patient, onClose, onSaved }: {
  patient: Patient; onClose: () => void; onSaved: (updated: Patient) => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: patient.name, email: patient.email,
    phone: patient.phone || '', dateOfBirth: patient.dateOfBirth || '',
    address: patient.address || '', password: '',
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
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      const updated = await res.json();
      showToast('Patient info updated', 'success');
      onSaved({ ...patient, ...updated }); onClose();
    } catch { setError('Server error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontSize: '20px' }}>Edit Patient Info</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" name="email" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setForm(f=>({...f,dateOfBirth:e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password (leave blank to keep)</label>
            <input className="form-input" type="text" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Enter new password" />
          </div>
          {error && <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: '7px', color: '#b91c1c', fontSize: '13px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const id = Number(params.id);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [apptModal, setApptModal] = useState<{ open: boolean; appt: Appt | null }>({ open: false, appt: null });
  const [rxModal, setRxModal] = useState<{ open: boolean; rx: Rx | null }>({ open: false, rx: null });
  const [patientModal, setPatientModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions'>('appointments');
  const [deletingAppt, setDeletingAppt] = useState<number | null>(null);
  const [deletingRx, setDeletingRx] = useState<number | null>(null);
  const [statusAppt, setStatusAppt] = useState<number | null>(null);
  const [statusRx, setStatusRx] = useState<number | null>(null);

  async function load() {
    const r = await fetch(`/api/patients/${id}`);
    const data = await r.json();
    setPatient(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function deleteAppt(apptId: number, providerName: string) {
    if (!confirm(`Delete appointment with ${providerName}?`)) return;
    setDeletingAppt(apptId);
    setPatient(p => p ? { ...p, appointments: p.appointments.filter(a => a.id !== apptId) } : p);
    try {
      const res = await fetch(`/api/patients/${id}/appointments/${apptId}`, { method: 'DELETE' });
      if (!res.ok) { load(); showToast('Failed to delete appointment', 'error'); return; }
      showToast('Appointment deleted', 'info');
    } catch { load(); showToast('Failed to delete', 'error'); }
    finally { setDeletingAppt(null); }
  }

  async function deleteRx(rxId: number, medName: string) {
    if (!confirm(`Delete ${medName} prescription?`)) return;
    setDeletingRx(rxId);
    setPatient(p => p ? { ...p, prescriptions: p.prescriptions.filter(r => r.id !== rxId) } : p);
    try {
      const res = await fetch(`/api/patients/${id}/prescriptions/${rxId}`, { method: 'DELETE' });
      if (!res.ok) { load(); showToast('Failed to delete prescription', 'error'); return; }
      showToast(`${medName} prescription removed`, 'info');
    } catch { load(); showToast('Failed to delete', 'error'); }
    finally { setDeletingRx(null); }
  }

  async function cancelAppt(apptId: number, providerName: string) {
    const reason = prompt(`Reason for cancelling appointment with ${providerName}? (optional)`);
    if (reason === null) return;
    setStatusAppt(apptId);
    try {
      const res = await fetch(`/api/patients/${id}/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', notes: reason || undefined }),
      });
      if (!res.ok) { showToast('Failed to cancel appointment', 'error'); return; }
      setPatient(p => p ? {
        ...p,
        appointments: p.appointments.map(a =>
          a.id === apptId ? { ...a, status: 'cancelled', notes: reason || undefined } : a
        ),
      } : p);
      showToast(`Appointment with ${providerName} cancelled`, 'info');
    } catch { showToast('Failed to cancel', 'error'); }
    finally { setStatusAppt(null); }
  }

  async function completeAppt(apptId: number, providerName: string) {
    setStatusAppt(apptId);
    try {
      const res = await fetch(`/api/patients/${id}/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!res.ok) { showToast('Failed to mark as completed', 'error'); return; }
      setPatient(p => p ? {
        ...p,
        appointments: p.appointments.map(a =>
          a.id === apptId ? { ...a, status: 'completed' } : a
        ),
      } : p);
      showToast(`Appointment with ${providerName} marked as completed`, 'success');
    } catch { showToast('Failed to update', 'error'); }
    finally { setStatusAppt(null); }
  }

  async function discontinueRx(rxId: number, medName: string) {
    const reason = prompt(`Reason for discontinuing ${medName}? (optional)`);
    if (reason === null) return;
    setStatusRx(rxId);
    try {
      const res = await fetch(`/api/patients/${id}/prescriptions/${rxId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'discontinued', notes: reason || undefined }),
      });
      if (!res.ok) { showToast('Failed to discontinue prescription', 'error'); return; }
      setPatient(p => p ? {
        ...p,
        prescriptions: p.prescriptions.map(r =>
          r.id === rxId ? { ...r, status: 'discontinued', notes: reason || undefined } : r
        ),
      } : p);
      showToast(`${medName} discontinued`, 'info');
    } catch { showToast('Failed to update', 'error'); }
    finally { setStatusRx(null); }
  }

  function handleApptSaved(saved: Appt) {
    setPatient(p => {
      if (!p) return p;
      const exists = p.appointments.find(a => a.id === saved.id);
      const appointments = exists ? p.appointments.map(a => a.id === saved.id ? saved : a) : [...p.appointments, saved];
      return { ...p, appointments };
    });
  }

  function handleRxSaved(saved: Rx) {
    setPatient(p => {
      if (!p) return p;
      const exists = p.prescriptions.find(r => r.id === saved.id);
      const prescriptions = exists ? p.prescriptions.map(r => r.id === saved.id ? saved : r) : [...p.prescriptions, saved];
      return { ...p, prescriptions };
    });
  }

  if (loading || !patient) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#0d9488' }}>
      Loading patient record…
    </div>
  );

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom: '24px' }}>
        <button className="btn btn-ghost" onClick={() => router.push('/admin')} style={{ marginBottom: '8px', padding: '4px 0' }}>
          ← All Patients
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: '#ccfbef', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e', fontWeight: 700, fontSize: '20px' }}>
              {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h1 style={{ margin: '0 0 3px', fontSize: '26px' }}>{patient.name}</h1>
              <div style={{ color: '#4a7c73', fontSize: '14px' }}>{patient.email}</div>
              {patient.phone && <div style={{ color: '#4a7c73', fontSize: '13px' }}>{patient.phone}</div>}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => setPatientModal(true)}>✏️ Edit Info</button>
        </div>
      </div>

      <div className="animate-fade-up stagger-1" style={{ background: 'white', border: '1px solid #d1fae5', borderRadius: '10px', padding: '14px 20px', marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Date of Birth', value: patient.dateOfBirth || '—' },
          { label: 'Address', value: patient.address || '—' },
          { label: 'Appointments', value: patient.appointments.length },
          { label: 'Prescriptions', value: patient.prescriptions.length },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#4a7c73', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</div>
            <div style={{ fontSize: '14px', color: '#0f2623', fontWeight: 500, marginTop: '2px' }}>{f.value}</div>
          </div>
        ))}
      </div>

      <div className="animate-fade-up stagger-2" style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f0fdf9', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {(['appointments', 'prescriptions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 20px', borderRadius: '7px', fontSize: '14px', fontWeight: 500,
            border: 'none', cursor: 'pointer',
            background: activeTab === tab ? 'white' : 'transparent',
            color: activeTab === tab ? '#0f766e' : '#4a7c73',
            boxShadow: activeTab === tab ? '0 1px 4px rgba(15,118,110,0.1)' : 'none',
            transition: 'all 0.15s ease',
          }}>
            {tab === 'appointments' ? `📅 Appointments (${patient.appointments.length})` : `💊 Prescriptions (${patient.prescriptions.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'appointments' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button className="btn btn-primary" onClick={() => setApptModal({ open: true, appt: null })}>+ Schedule Appointment</button>
          </div>
          {patient.appointments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#4a7c73' }}>No appointments scheduled.</div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #d1fae5', borderRadius: '12px', overflow: 'hidden' }}>
              <table className="data-table">
                <thead><tr><th>Provider</th><th>Date & Time</th><th>Repeat</th><th>Ends On</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {patient.appointments.map(appt => {
                    const status = appt.status || 'active';
                    const isInactive = status !== 'active';
                    return (
                      <tr key={appt.id} style={{ opacity: deletingAppt === appt.id ? 0.4 : 1, transition: 'opacity 0.2s', background: isInactive ? '#fafafa' : undefined }}>
                        <td style={{ fontWeight: 600, color: isInactive ? '#94a3b8' : '#0f2623' }}>{appt.provider}</td>
                        <td style={{ color: isInactive ? '#94a3b8' : undefined }}>{fmtDT(appt.datetime)}</td>
                        <td><span className="badge badge-teal">{appt.repeat === 'none' ? 'One-time' : appt.repeat}</span></td>
                        <td style={{ color: '#4a7c73', fontSize: '13px' }}>{appt.endDate ? fmtDate(appt.endDate) : '—'}</td>
                        <td>
                          {status === 'active' && <span className="badge badge-teal">Active</span>}
                          {status === 'completed' && <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Completed</span>}
                          {status === 'cancelled' && <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>Cancelled</span>}
                          {appt.notes && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={appt.notes}>📝 {appt.notes}</div>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {!isInactive && <>
                              <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => setApptModal({ open: true, appt })}>Edit</button>
                              <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px', color: '#1d4ed8', borderColor: '#bfdbfe' }} onClick={() => completeAppt(appt.id, appt.provider)} disabled={statusAppt === appt.id}>✓ Done</button>
                              <button className="btn btn-danger" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => cancelAppt(appt.id, appt.provider)} disabled={statusAppt === appt.id}>Cancel</button>
                            </>}
                            <button className="btn btn-danger" style={{ fontSize: '12px', padding: '4px 10px', opacity: 0.7 }} onClick={() => deleteAppt(appt.id, appt.provider)} disabled={deletingAppt === appt.id}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button className="btn btn-primary" onClick={() => setRxModal({ open: true, rx: null })}>+ Add Prescription</button>
          </div>
          {patient.prescriptions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#4a7c73' }}>No prescriptions on file.</div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #d1fae5', borderRadius: '12px', overflow: 'hidden' }}>
              <table className="data-table">
                <thead><tr><th>Medication</th><th>Dosage</th><th>Qty</th><th>Next Refill</th><th>Schedule</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {patient.prescriptions.map(rx => {
                    const status = rx.status || 'active';
                    const isInactive = status !== 'active';
                    return (
                      <tr key={rx.id} style={{ opacity: deletingRx === rx.id ? 0.4 : 1, transition: 'opacity 0.2s', background: isInactive ? '#fafafa' : undefined }}>
                        <td style={{ fontWeight: 600, color: isInactive ? '#94a3b8' : '#0f2623' }}>{rx.medication}</td>
                        <td style={{ color: isInactive ? '#94a3b8' : undefined }}>{rx.dosage}</td>
                        <td style={{ color: isInactive ? '#94a3b8' : undefined }}>{rx.quantity}</td>
                        <td style={{ color: isInactive ? '#94a3b8' : undefined }}>{fmtDate(rx.refillOn)}</td>
                        <td><span className="badge badge-slate">{rx.refillSchedule}</span></td>
                        <td>
                          {status === 'active' && <span className="badge badge-teal">Active</span>}
                          {status === 'discontinued' && <span className="badge" style={{ background: '#fffbeb', color: '#92400e' }}>Discontinued</span>}
                          {status === 'completed' && <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Completed</span>}
                          {rx.notes && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rx.notes}>📝 {rx.notes}</div>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {!isInactive && <>
                              <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => setRxModal({ open: true, rx })}>Edit</button>
                              <button className="btn btn-danger" style={{ fontSize: '12px', padding: '4px 10px', background: '#fffbeb', color: '#92400e' }} onClick={() => discontinueRx(rx.id, rx.medication)} disabled={statusRx === rx.id}>Discontinue</button>
                            </>}
                            <button className="btn btn-danger" style={{ fontSize: '12px', padding: '4px 10px', opacity: 0.7 }} onClick={() => deleteRx(rx.id, rx.medication)} disabled={deletingRx === rx.id}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {apptModal.open && (
        <ApptModal appt={apptModal.appt} patientId={id} existingAppts={patient.appointments}
          onClose={() => setApptModal({ open: false, appt: null })} onSaved={handleApptSaved} />
      )}
      {rxModal.open && (
        <RxModal rx={rxModal.rx} patientId={id}
          onClose={() => setRxModal({ open: false, rx: null })} onSaved={handleRxSaved} />
      )}
      {patientModal && (
        <PatientModal patient={patient} onClose={() => setPatientModal(false)} onSaved={setPatient} />
      )}
    </div>
  );
}