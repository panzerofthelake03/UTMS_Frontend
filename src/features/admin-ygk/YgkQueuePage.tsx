import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

export default function YgkQueuePage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.ygkList().then((r) => setApps(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>Evaluation Queue (YGK)</h2>
      {apps.length === 0 ? (
        <EmptyState message="No applications pending YGK evaluation." />
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>{['Student', 'Term', 'GPA', 'Status', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={td}>{a.studentFirstName} {a.studentLastName}</td>
                <td style={td}>{a.term}</td>
                <td style={td}>{a.gpa ?? '—'}</td>
                <td style={td}><ApplicationStatusBadge status={a.status} /></td>
                <td style={td}>
                  <button onClick={() => navigate(`/admin/ygk/applications/${a.id}`)} style={actionBtn}>Evaluate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', background: '#f9fafb', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' };
const td: React.CSSProperties = { padding: '10px 12px' };
const actionBtn: React.CSSProperties = { background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontSize: 13 };
