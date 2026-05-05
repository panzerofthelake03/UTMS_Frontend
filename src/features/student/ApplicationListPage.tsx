import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi, type Application } from '../../shared/api/applicationApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

export default function ApplicationListPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    applicationApi.list()
      .then((r) => setApps(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    const ok = window.confirm('Delete this draft application? This cannot be undone.');
    if (!ok) return;

    setServerError(null);
    setDeletingId(id);
    try {
      await applicationApi.deleteApplication(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setServerError(err.response?.data?.error?.message ?? 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={pageHeading}>My Applications</h2>
        <Link to="/student/applications/new">
          <button style={primaryBtn}>+ New Application</button>
        </Link>
      </div>
      {serverError && <div style={errBox}>{serverError}</div>}
      {apps.length === 0 ? (
        <EmptyState message="You have no applications yet. Start one now!" />
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {['#', 'Term', 'Status', 'Submitted', 'Created', ''].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={td}>{a.id}</td>
                <td style={td}>{a.term}</td>
                <td style={td}><ApplicationStatusBadge status={a.status} /></td>
                <td style={td}>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '-'}</td>
                <td style={td}>{new Date(a.createdAt).toLocaleDateString()}</td>
                <td style={td}>
                  <Link to={`/student/applications/${a.id}`} style={{ color: '#1d3c6e', fontSize: 13 }}>
                    View
                  </Link>
                  {a.status === 'DRAFT' && (
                    <button
                      onClick={() => void handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      style={deleteBtn}
                    >
                      {deletingId === a.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
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
const pageHeading: React.CSSProperties = { margin: 0, color: '#1d3c6e' };
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', background: '#f9fafb', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' };
const td: React.CSSProperties = { padding: '10px 12px' };
const primaryBtn: React.CSSProperties = { background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 };
const deleteBtn: React.CSSProperties = { marginLeft: 10, background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#b91c1c', marginBottom: 10 };
