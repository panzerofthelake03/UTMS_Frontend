import { useEffect, useState } from 'react';
import { adminApi, type PlacementEntry } from '../../shared/api/adminApi';
import Spinner from '../../shared/components/Spinner';
import EmptyState from '../../shared/components/EmptyState';

const PRIMARY = '#8b1a1a';

export default function YgkPlacementPage() {
  const [entries, setEntries] = useState<PlacementEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.ygkPlacement().then((r) => setEntries(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Yerleştirme Listesi</h2>
      <p className="text-sm text-gray-500 mb-5">
        YGK değerlendirmesi tamamlanan başvurular — bileşik skora göre sıralı.
      </p>

      {entries.length === 0 ? (
        <EmptyState message="Henüz değerlendirilmiş başvuru yok." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {['Sıra', 'Öğrenci', 'Öğrenci No', 'Bölüm', 'Dönem', 'Bileşik Skor', 'Durum'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
                      style={{ background: e.rank <= 3 ? PRIMARY : '#6b7280' }}
                    >
                      {e.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{e.studentName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.studentNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{e.department}</td>
                  <td className="px-4 py-3 text-gray-600">{e.term}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-base" style={{ color: PRIMARY }}>
                      {e.compositeScore != null ? Number(e.compositeScore).toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Toplam {entries.length} başvuru
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_DEAN_APPROVAL: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Dekanlık Onayı' },
    ACCEPTED:              { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Kabul Edildi'   },
    REJECTED:              { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Reddedildi'     },
  };
  const c = cfg[status] ?? { bg: 'bg-gray-50', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
