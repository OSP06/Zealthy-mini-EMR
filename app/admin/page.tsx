'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
  _count: { appointments: number; prescriptions: number };
}

export default function AdminPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/patients')
      .then(r => r.json())
      .then(data => { setPatients(data); setLoading(false); });
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '28px' }}>Patient Registry</h1>
          <p style={{ margin: 0, color: '#4a7c73', fontSize: '15px' }}>
            {patients.length} patient{patients.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => router.push('/admin/new-patient')}
          style={{ gap: '6px' }}
        >
          <span style={{ fontSize: '16px' }}>+</span> New Patient
        </button>
      </div>

      {/* Search */}
      <div className="animate-fade-up stagger-1" style={{ marginBottom: '20px' }}>
        <input
          className="form-input"
          type="text"
          placeholder="Search patients by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '400px', width: '100%' }}
        />
      </div>

      {/* Table */}
      <div className="animate-fade-up stagger-2" style={{
        background: 'white',
        border: '1px solid #d1fae5',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(15,118,110,0.06)',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#0d9488' }}>Loading patients…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#4a7c73' }}>No patients found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Appts</th>
                <th>Rx</th>
                <th>Enrolled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/patients/${p.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px',
                        background: '#ccfbef',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#0f766e', fontWeight: 700, fontSize: '13px',
                        flexShrink: 0,
                      }}>
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0f2623' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#4a7c73' }}>{p.email}</td>
                  <td style={{ color: '#4a7c73' }}>{p.phone || '—'}</td>
                  <td>
                    <span className="badge badge-teal">{p._count.appointments}</span>
                  </td>
                  <td>
                    <span className="badge badge-slate">{p._count.prescriptions}</span>
                  </td>
                  <td style={{ color: '#4a7c73', fontSize: '13px' }}>
                    {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '5px 12px' }}
                      onClick={e => { e.stopPropagation(); router.push(`/admin/patients/${p.id}`); }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
