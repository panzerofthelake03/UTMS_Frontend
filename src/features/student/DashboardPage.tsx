import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationApi, type Application } from '../../shared/api/applicationApi';
import { useAppSelector } from '../../shared/hooks';
import Spinner from '../../shared/components/Spinner';

const FEATURE_CARDS = [
  {
    icon: '📤',
    title: 'Document Upload',
    subtitle: 'Upload required documents',
    to: '/student/applications/new',
    dot: true,
  },
  {
    icon: '↗',
    title: 'Application Status Tracking',
    subtitle: 'Track your application stage',
    to: '/student/status',
    dot: false,
  },
  {
    icon: '🏆',
    title: 'View Results',
    subtitle: 'Check final decision',
    to: '/student/results',
    dot: false,
  },
  {
    icon: '🎧',
    title: 'Contact & Support',
    subtitle: 'Contact Student Affairs',
    to: '/student/contact',
    dot: false,
  },
];

export default function StudentDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationApi.list().then((r) => setApps(r.data.data)).finally(() => setLoading(false));
  }, []);

  const latest = apps[0];
  const statusLabel = latest ? latest.status.replace(/_/g, ' ') : 'No Application Yet';

  return (
    <div className="p-6 md:p-10">
      {/* Welcome heading */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome, {user?.firstName} {user?.lastName}
      </h1>

      {/* Status badge */}
      {loading ? (
        <div className="mb-8"><Spinner /></div>
      ) : (
        <span className="inline-flex items-center mb-8 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
          ● Current Status: {statusLabel}
        </span>
      )}

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
        {FEATURE_CARDS.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.to)}
            className="group relative bg-white border border-gray-100 rounded-2xl p-6 text-left hover:shadow-lg hover:border-[#8b1a1a]/20 transition-all duration-200 cursor-pointer"
          >
            {card.dot && (
              <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-red-500" />
            )}
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-[#8b1a1a]/5 transition">
              {card.icon}
            </div>
            <div className="font-bold text-gray-900 text-base mb-1">{card.title}</div>
            <div className="text-sm text-gray-500">{card.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
