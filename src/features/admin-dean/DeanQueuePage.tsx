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
        <EmptyState message="Onay bekleyen başvuru yok." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {['Öğrenci', 'Bölüm', 'Dönem', 'Durum', 'Başvuru Tarihi', ''].map((h) => (
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
                  <td className="px-4 py-3 text-gray-600">{a.department ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.term}</td>
                  <td className="px-4 py-3"><ApplicationStatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/admin/dean/applications/${a.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                      style={{ background: PRIMARY }}
                    >
                      İncele
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
