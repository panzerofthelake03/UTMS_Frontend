import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import EmptyState from '../../shared/components/EmptyState';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

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

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Intibak Queue</h1>
      <p className="text-sm text-gray-500 mb-6">Applications awaiting credit transfer (intibak) review.</p>

      {apps.length === 0 ? (
        <EmptyState message="No applications pending Intibak review." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr>
                  {['Student', 'Email', 'Term', 'Status', 'Submitted', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{app.studentFirstName} {app.studentLastName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{app.studentEmail}</td>
                    <td className="px-4 py-3 text-gray-600">{app.term}</td>
                    <td className="px-4 py-3"><ApplicationStatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/intibak/applications/${app.id}`)}
                        className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-85"
                        style={{ background: PRIMARY }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {apps.length} application{apps.length !== 1 ? 's' : ''} pending review
          </div>
        </div>
      )}
    </div>
  );
}
