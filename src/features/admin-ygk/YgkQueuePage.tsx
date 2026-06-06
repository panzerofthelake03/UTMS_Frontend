import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminApplication } from '../../shared/api/adminApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const PRIMARY = '#8b1a1a';

export default function YgkQueuePage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.ygkList().then((r) => setApps(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Evaluation Queue</h1>
      <p className="text-sm text-gray-500 mb-6">Applications awaiting Faculty Administrative Board (YGK) evaluation.</p>

      {apps.length === 0 ? (
        <EmptyState message="No applications pending YGK evaluation." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[520px]">
              <thead>
                <tr>
                  {['Student', 'Department', 'Term', 'GPA', 'Status', ''].map((h) => (
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
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{a.gpa ?? '—'}</td>
                    <td className="px-4 py-3"><ApplicationStatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/ygk/applications/${a.id}`)}
                        className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-85"
                        style={{ background: PRIMARY }}
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {apps.length} application{apps.length !== 1 ? 's' : ''} pending evaluation
          </div>
        </div>
      )}
    </div>
  );
}
