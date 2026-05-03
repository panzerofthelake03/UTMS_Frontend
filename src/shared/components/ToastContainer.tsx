import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'error' | 'success' | 'warning';
}

let _notify: ((msg: string, type?: ToastMessage['type']) => void) | null = null;

/** Call from anywhere (e.g. Axios interceptors) to show a toast notification. */
export function showToast(message: string, type: ToastMessage['type'] = 'error') {
  _notify?.(message, type);
}

const BG: Record<ToastMessage['type'], string> = {
  error:   '#b91c1c',
  warning: '#b45309',
  success: '#15803d',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    _notify = (message, type = 'error') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    };
    return () => { _notify = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          style={{
            background: BG[t.type],
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 6,
            fontSize: 14,
            maxWidth: 360,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
