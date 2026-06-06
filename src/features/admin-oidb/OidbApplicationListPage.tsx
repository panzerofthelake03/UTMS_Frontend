import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const PRIMARY = '#8b1a1a';

export default function OidbApplicationListPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.oidbList().then((r) => setApps(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Applications Inbox</h1>
      <p className="text-sm text-gray-500 mb-6">Review and forward submitted transfer applications.</p>

      {apps.length === 0 ? (
        <EmptyState message="No applications in the OIDB queue." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr>
                  {['Student', 'Term', 'GPA', 'Status', 'Submitted', ''].map((h) => (
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
                    <td className="px-4 py-3 text-gray-600">{a.term}</td>
                    <td className="px-4 py-3 text-gray-600">{a.gpa ?? '—'}</td>
                    <td className="px-4 py-3"><ApplicationStatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/oidb/applications/${a.id}`)}
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
