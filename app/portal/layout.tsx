'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User { id: number; name: string; email: string; }

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) router.push('/');
      else setUser(d.user);
    });
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf9' }}>
      <div style={{ color: '#0d9488', fontSize: '14px' }}>Loading…</div>
    </div>
  );

  const navLinks = [
    { href: '/portal', label: 'Dashboard', icon: '⊡' },
    { href: '/portal/appointments', label: 'Appointments', icon: '📅' },
    { href: '/portal/medications', label: 'Medications', icon: '💊' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fffe' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid #d1fae5',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f0fdf9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px',
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#0f766e', lineHeight: 1 }}>Zealthy</div>
              <div style={{ fontSize: '10px', color: '#4a7c73', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Patient Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ marginBottom: '4px', padding: '0 2px', fontSize: '10px', fontWeight: 600, color: '#4a7c73', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Menu</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`sidebar-link ${pathname === l.href ? 'active' : ''}`}
              >
                <span style={{ fontSize: '16px' }}>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User & logout */}
        <div style={{ padding: '16px', borderTop: '1px solid #f0fdf9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: '#ccfbef',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0f766e', fontWeight: 600, fontSize: '14px',
            }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f2623', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: '#4a7c73', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', maxWidth: 'calc(100vw - 240px)' }}>
        {children}
      </main>
    </div>
  );
}
