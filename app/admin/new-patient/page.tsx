'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function NewPatientPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', dateOfBirth: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      showToast(`Patient ${form.name} created successfully`, 'success');
      router.push(`/admin/patients/${data.id}`);
    } catch {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="animate-fade-up" style={{ marginBottom: '28px' }}>
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: '12px', padding: '4px 0' }}>
          ← Back
        </button>
        <h1 style={{ margin: '0 0 4px', fontSize: '28px' }}>New Patient</h1>
        <p style={{ margin: 0, color: '#4a7c73', fontSize: '15px' }}>Add a new patient to the registry</p>
      </div>

      <div className="card animate-fade-up stagger-1">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="Jane Doe" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Email Address *</label>
              <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="patient@example.com" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Password *</label>
              <input className="form-input" name="password" type="text" value={form.password} onChange={handleChange} required placeholder="Patient login password" />
              <div style={{ fontSize: '11px', color: '#4a7c73', marginTop: '3px' }}>⚠️ Displayed in plaintext for testing purposes</div>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-input" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Address</label>
              <input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, New York, NY 10001" />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Patient'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}