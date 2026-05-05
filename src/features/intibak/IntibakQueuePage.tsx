import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import EmptyState from '../../shared/components/EmptyState';
import Spinner from '../../shared/components/Spinner';

export default function IntibakQueuePage() {
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.intibakQueueList()
      .then((r) => setApps(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (apps.length === 0) return <EmptyState message="No applications pending Intibak review." />;

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#1d3c6e' }}>Intibak Queue</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            {['Student', 'Email', 'Term', 'Status', 'Submitted', ''].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={tdStyle}>{app.studentFirstName} {app.studentLastName}</td>
              <td style={tdStyle}>{app.studentEmail}</td>
              <td style={tdStyle}>{app.term}</td>
              <td style={tdStyle}>
                <ApplicationStatusBadge status={app.status} />
              </td>
              <td style={tdStyle}>
                {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
              </td>
              <td style={tdStyle}>
                <button
                  style={actionBtn}
                  onClick={() => navigate(`/admin/intibak/applications/${app.id}`)}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  background: '#f9fafb',
  borderBottom: '2px solid #e5e7eb',
  color: '#374151',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};
const actionBtn: React.CSSProperties = {
  background: '#1d3c6e',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '5px 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};
