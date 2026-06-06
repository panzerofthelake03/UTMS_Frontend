import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi, type Application } from '../../shared/api/applicationApi';
import ApplicationStatusBadge from '../../shared/components/ApplicationStatusBadge';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const PRIMARY = '#8b1a1a';

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
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-0.5">My Applications</h1>
          <p className="text-sm text-gray-500">Track and manage your transfer applications.</p>
        </div>
        <Link to="/student/applications/new">
          <button
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-85"
            style={{ background: PRIMARY }}
          >
            + New Application
          </button>
        </Link>
      </div>

      {serverError && (
        <div className="mb-4 px-4 py-3 text-sm rounded-xl bg-red-50 border border-red-200 text-red-700">
          {serverError}
        </div>
      )}

      {apps.length === 0 ? (
        <EmptyState message="You have no applications yet. Start one now!" />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[520px]">
              <thead>
                <tr>
                  {['#', 'Term', 'Status', 'Submitted', 'Created', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.id}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{a.term}</td>
                    <td className="px-4 py-3"><ApplicationStatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/student/applications/${a.id}`}
                          className="text-xs font-semibold hover:opacity-75 transition-opacity"
                          style={{ color: PRIMARY }}
                        >
                          View
                        </Link>
                        {a.status === 'DRAFT' && (
                          <button
                            onClick={() => void handleDelete(a.id)}
                            disabled={deletingId === a.id}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                          >
                            {deletingId === a.id ? 'Deleting…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {apps.length} application{apps.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
