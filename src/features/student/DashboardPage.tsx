import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi, type Application } from '../../shared/api/applicationApi';
import { useAppSelector } from '../../shared/hooks';
import Spinner from '../../shared/components/Spinner';

const FEATURE_CARDS = [
  {
    icon: '�',
    title: 'My Profile',
    subtitle: 'View and update your personal information',
    to: '/student/profile',
  },
  {
    icon: '📊',
    title: 'Application Status Tracking',
    subtitle: 'Track the progress of your transfer application',
    to: '/student/applications',
  },
  {
    icon: '🏅',
    title: 'View Results',
    subtitle: 'Check your evaluation results and decisions',
    to: '/student/profile',
  },
  {
    icon: '🎧',
    title: 'Contact & Support',
    subtitle: 'Reach out to the admissions office for help',
    to: '/student/dashboard',
  },
];

export default function StudentDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationApi.list()
      .then((r) => setApps(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const latest = apps[apps.length - 1];
  const statusLabel = latest ? latest.status.replace(/_/g, ' ') : 'No Application';

  return (
    <div style={{ padding: '2.5rem 2rem' }}>
      {/* Welcome heading */}
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#111827' }}>
        Welcome, {user?.firstName} {user?.lastName}!
      </h1>

      {/* Status badge */}
      {loading ? (
        <Spinner />
      ) : (
        <div style={{
          display: 'inline-block',
          background: '#FEF3C7',
          color: '#92400E',
          padding: '5px 14px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 36,
        }}>
          Current Status: {statusLabel}
        </div>
      )}

      {/* Feature cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 20,
      }}>
        {FEATURE_CARDS.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.to)}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 48,
              height: 48,
              background: '#f3f4f6',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: 15, marginBottom: 4 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {card.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

