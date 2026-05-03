import type { TimelineEntry } from '../../../shared/api/applicationApi';

export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p style={{ color: '#6b7280', fontSize: 14 }}>No timeline entries yet.</p>;

  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative' }}>
      {entries.map((e, i) => (
        <li key={e.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: i === entries.length - 1 ? '#1d3c6e' : '#93c5fd',
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            {i < entries.length - 1 && (
              <div style={{ width: 2, flex: 1, background: '#bfdbfe', marginTop: 2 }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {e.fromStatus ? `${e.fromStatus} → ` : ''}{e.toStatus}
            </div>
            {e.note && <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>{e.note}</div>}
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {new Date(e.changedAt).toLocaleString()} · {e.actorEmail}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
