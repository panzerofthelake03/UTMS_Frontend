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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const latest = apps[apps.length - 1];
  const appStatus = latest ? latest.status.replace(/_/g, ' ') : 'No Application';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.greeting}>Welcome, {user?.firstName} {user?.lastName}</h2>
        <div style={styles.statusBadge}>
          <span style={styles.statusDot}></span>
          Current Status: {appStatus}
        </div>
      </div>
      
      {loading ? (
        <Spinner />
      ) : (
        <div style={styles.grid}>
          <Link to="/student/applications/new" style={styles.card}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>📄</span> {/* Simplified icon placeholder */}
            </div>
            <h3 style={styles.cardTitle}>Document Upload</h3>
            <p style={styles.cardDesc}>Upload required documents</p>
          </Link>

          <Link to="/student/applications" style={styles.card}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>📈</span> 
            </div>
            <h3 style={styles.cardTitle}>Application Status Tracking</h3>
            <p style={styles.cardDesc}>Track your application stage</p>
          </Link>

          <Link to="/student/results" style={styles.card}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>🏅</span>
            </div>
            <h3 style={styles.cardTitle}>View Results</h3>
            <p style={styles.cardDesc}>Check final decision</p>
          </Link>

          <Link to="/support" style={styles.card}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>🎧</span>
            </div>
            <h3 style={styles.cardTitle}>Contact & Support</h3>
            <p style={styles.cardDesc}>Contact Student Affairs</p>
          </Link>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },
  header: {
    marginBottom: '3rem',
  },
  greeting: {
    fontSize: '2rem',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 1rem 0'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fffdf0',
    border: '1px solid #fde047',
    color: '#a16207',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 500
  },
  statusDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#eab308',
    borderRadius: '50%'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '2rem'
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #eaeaea',
    borderRadius: '12px',
    padding: '2rem',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  iconContainer: {
    marginBottom: '1rem',
    color: '#8c1515',
  },
  icon: {
    fontSize: '2rem'
  },
  cardTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#333'
  },
  cardDesc: {
    margin: 0,
    color: '#666',
    fontSize: '0.95rem'
  }
};
