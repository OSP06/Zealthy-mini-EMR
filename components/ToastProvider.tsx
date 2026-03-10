'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id));
    }, 3500);
  }, []);

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const colors = {
    success: { bg: '#f0fdf9', border: '#14b8a6', icon: '#0d9488', text: '#0f2623' },
    error:   { bg: '#fff1f2', border: '#f43f5e', icon: '#e11d48', text: '#0f2623' },
    info:    { bg: '#f0f9ff', border: '#38bdf8', icon: '#0284c7', text: '#0f2623' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => {
          const c = colors[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 18px',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                minWidth: '260px',
                maxWidth: '360px',
                animation: 'toastIn 0.3s ease both',
                pointerEvents: 'auto',
              }}
            >
              <div style={{
                width: '22px', height: '22px',
                borderRadius: '50%',
                background: c.icon,
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                flexShrink: 0,
              }}>
                {icons[toast.type]}
              </div>
              <span style={{ fontSize: '14px', color: c.text, fontWeight: 500 }}>
                {toast.message}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
