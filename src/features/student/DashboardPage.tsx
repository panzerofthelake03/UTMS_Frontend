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
      .catch(() => { })
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
              <span style={styles.icon}>📄</span>
            </div>
            {/* Added red visual badge for Document Upload based on Use Case */}
            <span style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              width: '12px',
              height: '12px',
              backgroundColor: '#ef4444',
              borderRadius: '50%'
            }}></span>
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
    width: '100%',
    margin: '0 auto',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },
  header: {
    marginBottom: '3rem',
    textAlign: 'center' as const,
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
    padding: '6px 20px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 600
  },
  statusDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#eab308',
    borderRadius: '50%'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '2rem',
    maxWidth: '900px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #eaeaea',
    borderRadius: '12px',
    padding: '3rem 2rem',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    position: 'relative' as const,
  },
  iconContainer: {
    marginBottom: '1rem',
    color: '#8c1515',
    backgroundColor: '#eff1f5',
    borderRadius: '8px',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '1.5rem',
  },
  cardTitle: {
    
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '0 0 0.5rem 0',
  },
  cardDesc: {
    fontSize: '0.9rem',
    color: '#666',
    margin: 0,
  }
}