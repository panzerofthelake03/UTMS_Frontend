import { useEffect, useState } from 'react';
import { notificationApi, type Notification } from '../../shared/api/notificationApi';

interface Props {
  onClose: () => void;
  onRead: () => void;
}

export default function NotificationPanel({ onClose, onRead }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationApi.list()
      .then((r) => setItems(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id: number) {
    await notificationApi.markRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    onRead();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9 }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '110%',
          width: 340,
          maxHeight: 420,
          overflowY: 'auto',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            fontWeight: 600,
            borderBottom: '1px solid #e5e7eb',
            fontSize: 14,
          }}
        >
          Notifications
        </div>
        {loading && <div style={{ padding: 16, fontSize: 13 }}>Loading…</div>}
        {!loading && items.length === 0 && (
          <div style={{ padding: 16, fontSize: 13, color: '#6b7280' }}>No notifications.</div>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.read && handleMarkRead(n.id)}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #f3f4f6',
              background: n.read ? '#fff' : '#eff6ff',
              cursor: n.read ? 'default' : 'pointer',
            }}
          >
            <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 13 }}>{n.title}</div>
            <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>{n.message}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              {new Date(n.sentAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
