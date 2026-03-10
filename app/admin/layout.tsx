'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin', label: 'All Patients', icon: '👥' },
    { href: '/admin/new-patient', label: 'New Patient', icon: '➕' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fffe' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: '#0f2623',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#5eead4', lineHeight: 1 }}>Zealthy</div>
              <div style={{ fontSize: '10px', color: '#4a7c73', letterSpacing: '0.05em', textTransform: 'uppercase' }}>EMR Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ marginBottom: '4px', padding: '0 2px', fontSize: '10px', fontWeight: 600, color: '#4a7c73', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Navigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
            {navLinks.map(l => {
              const isActive = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 14px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: 500,
                    color: isActive ? '#5eead4' : 'rgba(255,255,255,0.75)',
                    background: isActive ? 'rgba(20,184,166,0.15)' : 'transparent',
                    textDecoration: 'none', transition: 'all 0.15s ease',
                    border: isActive ? '1px solid rgba(20,184,166,0.3)' : '1px solid transparent',
                  }}
                >
                  <span>{l.icon}</span> {l.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            padding: '10px 12px',
            background: 'rgba(20,184,166,0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(20,184,166,0.2)',
          }}>
            <div style={{ fontSize: '11px', color: '#5eead4', fontWeight: 600, marginBottom: '2px' }}>⚕️ EMR System</div>
            <div style={{ fontSize: '11px', color: '#4a7c73' }}>No auth required (admin access)</div>
          </div>
          <Link
            href="/"
            style={{
              display: 'block', marginTop: '10px', textAlign: 'center',
              fontSize: '12px', color: '#4a7c73', textDecoration: 'none',
              padding: '6px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            ← Patient Portal
          </Link>
        </div>
      </aside>

      {/* Contents */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
