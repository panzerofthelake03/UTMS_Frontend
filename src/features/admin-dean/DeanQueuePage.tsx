import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import EmptyState from '../../shared/components/EmptyState';
import Spinner from '../../shared/components/Spinner';

const PRIMARY = '#8b1a1a';

export default function DeanQueuePage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.deanList().then((r) => setApps(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '2rem' }}>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Dekanlık Onay Kuyruğu</h2>
      <p className="text-sm text-gray-500 mb-5">YGK tarafından kabul edilen başvurular nihai onay bekliyor.</p>

      {apps.length === 0 ? (
        <EmptyState message="No applications pending dean approval." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr>
                  {['Student', 'Department', 'Term', 'Status', 'Submitted', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{a.studentFirstName} {a.studentLastName}</div>
                      <div className="text-xs text-gray-400">{a.studentEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.department ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.term}</td>
                    <td className="px-4 py-3"><ApplicationStatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/dean/applications/${a.id}`)}
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
            {apps.length} application{apps.length !== 1 ? 's' : ''} pending approval
          </div>
        </div>
      )}
    </div>
  );
}
