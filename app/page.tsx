'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        router.push('/portal');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf9 0%, #ccfbef 50%, #99f6e0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Decorative background shapes */}
      <div style={{
        position: 'fixed', top: '-80px', right: '-80px',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'rgba(20,184,166,0.08)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-100px', left: '-60px',
        width: '300px', height: '300px',
        borderRadius: '50%',
        background: 'rgba(20,184,166,0.06)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-up" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px', height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(20,184,166,0.3)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '32px', margin: '0 0 6px', color: '#0f766e' }}>Zealthy</h1>
          <p style={{ color: '#4a7c73', fontSize: '15px', margin: 0 }}>
            Sign in to your Patient Portal
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 8px 40px rgba(15,118,110,0.12)',
          border: '1px solid rgba(20,184,166,0.15)',
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: '#fee2e2',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ justifyContent: 'center', padding: '12px', fontSize: '15px' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #f0fdf9',
          }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
              Sample credentials: <strong>mark@some-email-provider.net</strong> / <strong>Password123!</strong>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#4a7c73' }}>
          Healthcare providers?{' '}
          <a href="/admin" style={{ color: '#0d9488', fontWeight: 500, textDecoration: 'none' }}>
            Access EMR →
          </a>
        </p>
      </div>
    </div>
  );
}
