import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi, type Application } from '../../shared/api/applicationApi';
import { useAppSelector } from '../../shared/hooks';
import Spinner from '../../shared/components/Spinner';

export default function StudentDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationApi.list()
      .then((r) => setApps(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const latest = apps[apps.length - 1];

  return (
    <div>
      <h2>Welcome, {user?.firstName}!</h2>
      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
          <div style={card}>
            <div style={cardLabel}>Total Applications</div>
            <div style={cardValue}>{apps.length}</div>
          </div>
          {latest && (
            <div style={card}>
              <div style={cardLabel}>Latest Status</div>
              <div style={cardValue}>{latest.status.replace(/_/g, ' ')}</div>
            </div>
          )}
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        <Link to="/student/applications/new">
          <button style={primaryBtn}>+ New Application</button>
        </Link>
        <Link to="/student/applications" style={{ marginLeft: 12 }}>
          <button style={secondaryBtn}>View All Applications</button>
        </Link>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 8,
  padding: '1rem 1.5rem',
  minWidth: 160,
};
const cardLabel: React.CSSProperties = { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' };
const cardValue: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: '#1d3c6e', marginTop: 4 };
const primaryBtn: React.CSSProperties = { background: '#1d3c6e', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 };
const secondaryBtn: React.CSSProperties = { background: '#fff', color: '#1d3c6e', border: '1px solid #1d3c6e', borderRadius: 4, padding: '10px 20px', cursor: 'pointer' };
